import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './notifications.center.module.scss';
import notificationService from '../../services/notification.service';
import { NotificationItem } from '../../types/notification.types';
import { useToastActions } from '../../contexts/ToastContext';
import {
    NOTIFICATION_ALL_READ_EVENT,
    NOTIFICATION_DELETED_EVENT,
    NOTIFICATION_NEW_EVENT,
    NOTIFICATION_READ_EVENT,
    NOTIFICATION_UNREAD_COUNT_EVENT,
} from '../../utils/notification-realtime';
import type {
    NotificationDeletedPayload,
    NotificationReadPayload,
    NotificationRealtimePayload,
    NotificationUnreadCountPayload,
} from '../../types/socket.types';
import { getNotificationNavigationTarget } from '../../utils/notification-navigation';

type NotificationTabKey = 'ALL' | 'UNREAD' | 'SYSTEM';

const PAGE_SIZE = 20;

const formatNotificationTime = (value: string): string => {
    const createdAt = new Date(value);
    const diffMs = Date.now() - createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / (60 * 1000));

    if (diffMinutes < 1) {
        return 'Vừa xong';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(createdAt);
};

const getNotificationQuery = (tab: NotificationTabKey) => {
    if (tab === 'UNREAD') {
        return { isRead: false };
    }

    if (tab === 'SYSTEM') {
        return { senderType: 'system' };
    }

    return {};
};

const NotificationsCenter: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToastActions();
    const [activeTab, setActiveTab] = useState<NotificationTabKey>('ALL');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [allCount, setAllCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [systemCount, setSystemCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchCounts = useCallback(async () => {
        const [allResponse, unreadResponse, systemResponse] = await Promise.all([
            notificationService.getNotifications({ limit: 1, skip: 0 }),
            notificationService.getUnreadCount(),
            notificationService.getNotifications({ limit: 1, skip: 0, senderType: 'system' }),
        ]);

        setAllCount(allResponse.data.data.totalCount);
        setUnreadCount(unreadResponse.data.data.unreadCount);
        setSystemCount(systemResponse.data.data.totalCount);
    }, []);

    const loadNotifications = useCallback(async (tab: NotificationTabKey, append = false, skip = 0) => {
        const nextSkip = append ? skip : 0;

        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
            setErrorMessage(null);
        }

        try {
            const response = await notificationService.getNotifications({
                limit: PAGE_SIZE,
                skip: nextSkip,
                ...getNotificationQuery(tab),
            });

            const payload = response.data.data;
            setNotifications((current) => append ? [...current, ...payload.notifications] : payload.notifications);
            setHasMore(payload.hasMore);

            if (tab === 'ALL') {
                setAllCount(payload.totalCount);
                setUnreadCount(payload.unreadCount);
            }
        } catch (error) {
            console.error('Không thể tải danh sách thông báo:', error);
            setErrorMessage('Không thể tải thông báo. Vui lòng thử lại.');
        } finally {
            if (append) {
                setIsLoadingMore(false);
            } else {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadNotifications(activeTab);
    }, [activeTab, loadNotifications]);

    useEffect(() => {
        fetchCounts().catch((error) => {
            console.error('Không thể tải thống kê thông báo:', error);
        });
    }, [fetchCounts]);

    useEffect(() => {
        const handleNew = (event: Event) => {
            const customEvent = event as CustomEvent<NotificationRealtimePayload>;
            const nextNotification = customEvent.detail?.notification;
            if (!nextNotification) {
                return;
            }

            setAllCount((current) => current + 1);
            setUnreadCount(customEvent.detail.unreadCount);
            if (nextNotification.senderType === 'system') {
                setSystemCount((current) => current + 1);
            }

            const shouldInsert =
                activeTab === 'ALL'
                || activeTab === 'UNREAD'
                || (activeTab === 'SYSTEM' && nextNotification.senderType === 'system');

            if (!shouldInsert) {
                return;
            }

            setNotifications((current) => [nextNotification, ...current.filter((item) => item._id !== nextNotification._id)]);
        };

        const handleRead = (event: Event) => {
            const customEvent = event as CustomEvent<NotificationReadPayload>;
            const payload = customEvent.detail;
            setUnreadCount(payload.unreadCount);

            setNotifications((current) => {
                if (activeTab === 'UNREAD') {
                    return current.filter((item) => item._id !== payload.notificationId);
                }

                return current.map((item) => (
                    item._id === payload.notificationId
                        ? { ...item, isRead: true, readAt: new Date().toISOString() }
                        : item
                ));
            });
        };

        const handleAllRead = (event: Event) => {
            const customEvent = event as CustomEvent<NotificationUnreadCountPayload>;
            setUnreadCount(customEvent.detail.unreadCount);
            setNotifications((current) => (
                activeTab === 'UNREAD'
                    ? []
                    : current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
            ));
        };

        const handleDeleted = (event: Event) => {
            const customEvent = event as CustomEvent<NotificationDeletedPayload>;
            const payload = customEvent.detail;
            setNotifications((current) => current.filter((item) => item._id !== payload.notificationId));
            setAllCount((current) => Math.max(0, current - 1));
            setUnreadCount(payload.unreadCount);
            if (payload.senderType === 'system') {
                setSystemCount((current) => Math.max(0, current - 1));
            }
        };

        const handleUnreadCount = (event: Event) => {
            const customEvent = event as CustomEvent<NotificationUnreadCountPayload>;
            setUnreadCount(customEvent.detail.unreadCount);
        };

        window.addEventListener(NOTIFICATION_NEW_EVENT, handleNew);
        window.addEventListener(NOTIFICATION_READ_EVENT, handleRead);
        window.addEventListener(NOTIFICATION_ALL_READ_EVENT, handleAllRead);
        window.addEventListener(NOTIFICATION_DELETED_EVENT, handleDeleted);
        window.addEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, handleUnreadCount);

        return () => {
            window.removeEventListener(NOTIFICATION_NEW_EVENT, handleNew);
            window.removeEventListener(NOTIFICATION_READ_EVENT, handleRead);
            window.removeEventListener(NOTIFICATION_ALL_READ_EVENT, handleAllRead);
            window.removeEventListener(NOTIFICATION_DELETED_EVENT, handleDeleted);
            window.removeEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, handleUnreadCount);
        };
    }, [activeTab]);

    const tabItems = useMemo(() => ([
        { key: 'ALL' as const, label: 'Tất cả', count: allCount, iconClass: 'fa-regular fa-envelope' },
        { key: 'UNREAD' as const, label: 'Chưa đọc', count: unreadCount, iconClass: 'fa-regular fa-envelope-open' },
        { key: 'SYSTEM' as const, label: 'Thông báo hệ thống', count: systemCount, iconClass: 'fa-solid fa-microchip' },
    ]), [allCount, systemCount, unreadCount]);

    const handleOpenNotification = useCallback(async (notification: NotificationItem) => {
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification._id);
                setNotifications((current) => current.map((item) => (
                    item._id === notification._id
                        ? { ...item, isRead: true, readAt: new Date().toISOString() }
                        : item
                )));
                setUnreadCount((current) => Math.max(0, current - 1));
            } catch (error) {
                console.error('Không thể đánh dấu thông báo đã đọc:', error);
            }
        }

        navigate(getNotificationNavigationTarget(notification));
    }, [navigate]);

    const handleMarkAllAsRead = useCallback(async () => {
        setIsMarkingAll(true);
        try {
            await notificationService.markAllAsRead();
            setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
            showToast({
                type: 'success',
                title: 'Cập nhật thành công',
                message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
            });
        } catch (error) {
            console.error('Không thể đánh dấu tất cả thông báo đã đọc:', error);
            showToast({
                type: 'error',
                title: 'Cập nhật thất bại',
                message: 'Không thể cập nhật trạng thái thông báo.',
            });
        } finally {
            setIsMarkingAll(false);
        }
    }, [showToast]);

    return (
        <div className={styles.centerContainer}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h2>Trung tâm thông báo</h2>
                    <p>Theo dõi phản hồi duyệt hoạt động và các cập nhật quan trọng của bạn.</p>
                </div>
                <button className={styles.markReadBtn} disabled={isMarkingAll || unreadCount === 0} onClick={handleMarkAllAsRead}>
                    <i className="fa-solid fa-check-double"></i> {isMarkingAll ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}
                </button>
            </header>

            <div className={styles.tabBar}>
                {tabItems.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <i className={tab.iconClass}></i>
                        {tab.label}
                        <span className={styles.count}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {isLoading ? <div className={styles.stateBox}>Đang tải thông báo...</div> : null}
            {!isLoading && errorMessage ? <div className={styles.stateBox}>{errorMessage}</div> : null}
            {!isLoading && !errorMessage && notifications.length === 0 ? (
                <div className={styles.stateBox}>Hiện chưa có thông báo nào.</div>
            ) : null}

            {!isLoading && !errorMessage && notifications.map((notification) => (
                <button
                    key={notification._id}
                    type="button"
                    className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                    onClick={() => handleOpenNotification(notification)}
                >
                    <div className={`${styles.avatar} ${notification.senderType === 'system' ? styles.alertIcon : ''}`}>
                        {notification.senderType === 'system' ? (
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        ) : notification.type === 'ACTIVITY' ? (
                            <i className="fa-regular fa-bell"></i>
                        ) : (
                            <i className="fa-solid fa-building-columns"></i>
                        )}
                    </div>

                    <div className={styles.content}>
                        <div className={styles.senderRow}>
                            <span>{notification.senderName}</span>
                            {!notification.isRead && <div className={styles.dot}></div>}
                        </div>
                        <h6>{notification.title}</h6>
                        <p>{notification.message}</p>
                    </div>

                    <div className={styles.timestamp}>{formatNotificationTime(notification.createdAt)}</div>
                </button>
            ))}

            {hasMore ? (
                <button className={styles.loadMore} disabled={isLoadingMore} onClick={() => loadNotifications(activeTab, true, notifications.length)}>
                    {isLoadingMore ? 'Đang tải thêm...' : 'Tải thêm thông báo'}
                </button>
            ) : null}
        </div>
    );
};

export default NotificationsCenter;