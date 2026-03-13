import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faArrowUpRightFromSquare,
    faBell,
    faCalendarAlt,
    faCircleInfo,
    faClock,
    faMicrochip,
    faPeopleGroup,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './notification.detail.module.scss';
import notificationService from '../../services/notification.service';
import type { NotificationItem } from '../../types/notification.types';

const formatNotificationTime = (value?: string) => {
    if (!value) {
        return 'Không xác định';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Không xác định';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const getNotificationMeta = (notification: NotificationItem | null) => {
    if (!notification) {
        return {
            badge: 'Thông báo',
            icon: faBell,
            accentClass: '',
            description: '',
        };
    }

    if (notification.senderType === 'system') {
        return {
            badge: 'Thông báo hệ thống',
            icon: faMicrochip,
            accentClass: styles.systemTone,
            description: 'Được gửi bởi hệ thống tự động của UniActivity.',
        };
    }

    if (notification.type === 'ACTIVITY') {
        return {
            badge: 'Thông báo hoạt động',
            icon: faBell,
            accentClass: styles.activityTone,
            description: 'Được gửi từ chủ hoạt động hoặc người quản lý hoạt động.',
        };
    }

    if (notification.type === 'ORGANIZER') {
        return {
            badge: 'Thông báo ban tổ chức',
            icon: faPeopleGroup,
            accentClass: styles.organizerTone,
            description: 'Được gửi từ quy trình xét duyệt hoặc quản lý ban tổ chức.',
        };
    }

    if (notification.type === 'ALERT') {
        return {
            badge: 'Cảnh báo',
            icon: faTriangleExclamation,
            accentClass: styles.alertTone,
            description: 'Nội dung cần được chú ý sớm.',
        };
    }

    return {
        badge: 'Thông báo',
        icon: faCircleInfo,
        accentClass: '',
        description: 'Thông báo được gửi tới tài khoản của bạn.',
    };
};

const NotificationDetail: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const notificationId = searchParams.get('id') || '';

    const [notification, setNotification] = useState<NotificationItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadNotification = async () => {
            if (!notificationId) {
                setErrorMessage('Thiếu id thông báo.');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setErrorMessage(null);
                const response = await notificationService.getById(notificationId);
                const nextNotification = response.data.data;
                setNotification(nextNotification);

                if (!nextNotification.isRead) {
                    await notificationService.markAsRead(notificationId);
                    setNotification({
                        ...nextNotification,
                        isRead: true,
                        readAt: new Date().toISOString(),
                    });
                }
            } catch (error) {
                const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
                setErrorMessage(Array.isArray(responseMessage) ? responseMessage.join(', ') : responseMessage || 'Không thể tải chi tiết thông báo.');
            } finally {
                setIsLoading(false);
            }
        };

        loadNotification();
    }, [notificationId]);

    const notificationMeta = useMemo(() => getNotificationMeta(notification), [notification]);
    const activityTitle = typeof notification?.meta?.activityTitle === 'string' ? notification.meta.activityTitle : null;
    const notificationLinkUrl = notification?.linkUrl;

    if (isLoading) {
        return <div className={styles.stateBox}>Đang tải chi tiết thông báo...</div>;
    }

    if (errorMessage || !notification) {
        return <div className={styles.stateBox}>{errorMessage || 'Không tìm thấy thông báo.'}</div>;
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.mainContent}>
                <div className={styles.topBar}>
                    <button type="button" className={styles.backBtn} onClick={() => navigate('/notifications')}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Quay lại trung tâm thông báo
                    </button>
                </div>

                <section className={styles.card}>
                    <header className={styles.header}>
                        <div className={styles.brand}>
                            <div className={`${styles.logoCircle} ${notificationMeta.accentClass}`}>
                                <FontAwesomeIcon icon={notificationMeta.icon} />
                            </div>
                            <div className={styles.brandText}>
                                <h3>{notification.senderName}</h3>
                                <span>{notificationMeta.description}</span>
                            </div>
                        </div>
                        <div className={styles.meta}>
                            <span className={`${styles.badge} ${notificationMeta.accentClass}`}>{notificationMeta.badge}</span>
                            <p><FontAwesomeIcon icon={faClock} /> {formatNotificationTime(notification.createdAt)}</p>
                        </div>
                    </header>

                    <h1 className={styles.title}>{notification.title}</h1>

                    <div className={styles.metaPanel}>
                        <div>
                            <span className={styles.metaLabel}>Loại</span>
                            <strong>{notification.type}</strong>
                        </div>
                        <div>
                            <span className={styles.metaLabel}>Nguồn gửi</span>
                            <strong>{notification.senderType || 'Không xác định'}</strong>
                        </div>
                        <div>
                            <span className={styles.metaLabel}>Trạng thái</span>
                            <strong>{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</strong>
                        </div>
                    </div>

                    <p className={styles.description}>{notification.message}</p>

                    {activityTitle ? (
                        <div className={styles.relatedCard}>
                            <div className={styles.relatedIcon}>
                                <FontAwesomeIcon icon={faCalendarAlt} />
                            </div>
                            <div className={styles.relatedContent}>
                                <h4>{activityTitle}</h4>
                                <p>Thông báo này gắn với một hoạt động cụ thể. Bạn có thể mở activity để xem thêm chi tiết.</p>
                            </div>
                            {notificationLinkUrl ? (
                                <button type="button" className={styles.primaryBtn} onClick={() => navigate(notificationLinkUrl)}>
                                    Mở hoạt động <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    {notificationLinkUrl && !activityTitle ? (
                        <div className={styles.actionRow}>
                            <button type="button" className={styles.primaryBtn} onClick={() => navigate(notificationLinkUrl)}>
                                Mở liên kết đính kèm <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                            </button>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
};

export default NotificationDetail;