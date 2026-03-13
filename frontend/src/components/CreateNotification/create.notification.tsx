import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faPaperPlane,
    faTriangleExclamation,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './create.notification.module.scss';
import activityService from '../../services/activity.service';
import authService from '../../services/auth.service';
import notificationService, { SendActivityNotificationRequest } from '../../services/notification.service';
import { useToastActions } from '../../contexts/ToastContext';
import type { ActivityDetailResponse } from '../../types/activity.types';
import type { NotificationPriority } from '../../types/notification.types';
import type { ParticipantItem } from '../../types/participan.types';

type RecipientMode = 'ALL' | 'SELECTED';

const priorityOptions: Array<{ value: NotificationPriority; label: string }> = [
    { value: 'NORMAL', label: 'Bình thường' },
    { value: 'HIGH', label: 'Ưu tiên cao' },
    { value: 'URGENT', label: 'Khẩn cấp' },
];

const getErrorMessage = (error: unknown): string => {
    const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    if (Array.isArray(responseMessage)) {
        return responseMessage.join(', ');
    }

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
        return responseMessage;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return 'Không thể gửi thông báo. Vui lòng thử lại.';
};

const CreateNotification: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToastActions();
    const activityId = searchParams.get('activityId') || '';
    const currentUser = authService.getCurrentUser();
    const currentUserRole = authService.getRole();

    const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
    const [participants, setParticipants] = useState<ParticipantItem[]>([]);
    const [recipientMode, setRecipientMode] = useState<RecipientMode>('ALL');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<NotificationPriority>('NORMAL');
    const [linkUrl, setLinkUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadPageData = async () => {
            if (!activityId) {
                setErrorMessage('Thiếu activityId. Hãy mở trang này từ một hoạt động cụ thể.');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setErrorMessage(null);

                const [activityResponse, participantsResponse] = await Promise.all([
                    activityService.getDetail(activityId),
                    activityService.participantsByActivity(activityId),
                ]);

                const nextActivity = activityResponse.data?.data as ActivityDetailResponse;
                const nextParticipants = participantsResponse.data?.data;
                const normalizedParticipants = Array.isArray(nextParticipants) ? nextParticipants : [];

                if (!nextActivity.isOwner && currentUserRole !== 'ADMIN') {
                    setErrorMessage('Chỉ chủ hoạt động hoặc admin mới có thể gửi thông báo cho thành viên.');
                    setActivity(nextActivity);
                    setParticipants([]);
                    return;
                }

                setActivity(nextActivity);
                setParticipants(normalizedParticipants);
                setLinkUrl(`/detail/${activityId}`);
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        };

        loadPageData();
    }, [activityId, currentUserRole]);

    const filteredParticipants = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) {
            return participants;
        }

        return participants.filter((participant) => {
            const name = participant.studentName?.toLowerCase() || '';
            const code = participant.studentCode?.toLowerCase() || '';
            return name.includes(keyword) || code.includes(keyword);
        });
    }, [participants, searchTerm]);

    const selectableParticipants = useMemo(
        () => filteredParticipants.filter((participant): participant is ParticipantItem & { userId: string } => Boolean(participant.userId)),
        [filteredParticipants],
    );

    const totalRecipients = recipientMode === 'ALL' ? participants.length : selectedUserIds.length;
    const canSubmit = Boolean(
        activityId
        && activity
        && (activity.isOwner || currentUserRole === 'ADMIN')
        && participants.length > 0
        && title.trim()
        && message.trim()
        && (recipientMode === 'ALL' || selectedUserIds.length > 0),
    );

    const toggleRecipient = (userId: string) => {
        setSelectedUserIds((current) => (
            current.includes(userId)
                ? current.filter((value) => value !== userId)
                : [...current, userId]
        ));
    };

    const handleSelectAllVisible = () => {
        const visibleUserIds = selectableParticipants.map((participant) => participant.userId);
        setSelectedUserIds((current) => Array.from(new Set([...current, ...visibleUserIds])));
    };

    const handleClearSelection = () => {
        setSelectedUserIds([]);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!activityId || !activity) {
            setErrorMessage('Không xác định được hoạt động để gửi thông báo.');
            return;
        }

        if (!canSubmit) {
            setErrorMessage('Vui lòng nhập tiêu đề, nội dung và chọn ít nhất một người nhận hợp lệ.');
            return;
        }

        const payload: SendActivityNotificationRequest = {
            recipientMode,
            recipientUserIds: recipientMode === 'SELECTED' ? selectedUserIds : undefined,
            senderName: currentUser?.name || activity.organizer.name,
            senderType: 'activity-owner',
            title: title.trim(),
            message: message.trim(),
            priority,
            type: 'ACTIVITY',
            linkUrl: linkUrl.trim() || `/detail/${activityId}`,
            groupKey: `activity-notification:${activityId}`,
            meta: {
                activityId,
                activityTitle: activity.title,
            },
        };

        try {
            setIsSubmitting(true);
            setErrorMessage(null);
            const response = await notificationService.sendActivityNotification(activityId, payload);
            const recipientCount = response.data?.data?.recipientCount || totalRecipients;

            showToast({
                type: 'success',
                title: 'Gửi thông báo thành công',
                message: `Đã gửi thông báo cho ${recipientCount} thành viên của hoạt động.`,
                actionText: 'Về hoạt động',
                onAction: () => navigate(`/detail/${activityId}`),
            });

            setTitle('');
            setMessage('');
            setPriority('NORMAL');
            setRecipientMode('ALL');
            setSelectedUserIds([]);
            setSearchTerm('');
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.container} onSubmit={handleSubmit}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Gửi thông báo cho thành viên hoạt động</h1>
                    <p>Chủ hoạt động có thể gửi cho toàn bộ thành viên đã đăng ký hoặc chọn một vài thành viên cụ thể.</p>
                </div>
                {activity ? (
                    <button type="button" className={styles.secondaryBtn} onClick={() => navigate(`/detail/${activityId}`)}>
                        Quay lại hoạt động
                    </button>
                ) : null}
            </header>

            {!activityId ? (
                <div className={styles.errorBanner}>
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    <span>Thiếu activityId. Hãy mở màn này từ trang chi tiết hoạt động.</span>
                </div>
            ) : null}

            <div className={styles.layoutGrid}>
                <main>
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardStep}>1</span>
                            <div>
                                <h2>Hoạt động và người nhận</h2>
                                <p>Hệ thống chỉ cho gửi tới người đang nằm trong danh sách tham gia của hoạt động này.</p>
                            </div>
                        </div>

                        {isLoading ? <div className={styles.stateBox}>Đang tải dữ liệu hoạt động...</div> : null}
                        {!isLoading && errorMessage && !activity ? (
                            <div className={styles.errorBanner}>
                                <FontAwesomeIcon icon={faTriangleExclamation} />
                                <span>{errorMessage}</span>
                            </div>
                        ) : null}

                        {!isLoading && activity ? (
                            <>
                                <div className={styles.activitySummary}>
                                    <div>
                                        <strong>{activity.title}</strong>
                                        <span>{activity.organizer.name}</span>
                                    </div>
                                    <div className={styles.summaryMetrics}>
                                        <span><FontAwesomeIcon icon={faUsers} /> {participants.length} thành viên</span>
                                        <span><FontAwesomeIcon icon={faBell} /> {recipientMode === 'ALL' ? 'Gửi toàn bộ' : `${selectedUserIds.length} đã chọn`}</span>
                                    </div>
                                </div>

                                <div className={styles.modeTabs}>
                                    <button
                                        type="button"
                                        className={recipientMode === 'ALL' ? styles.activeTab : ''}
                                        onClick={() => setRecipientMode('ALL')}
                                        disabled={isSubmitting}
                                    >
                                        Tất cả thành viên
                                    </button>
                                    <button
                                        type="button"
                                        className={recipientMode === 'SELECTED' ? styles.activeTab : ''}
                                        onClick={() => setRecipientMode('SELECTED')}
                                        disabled={isSubmitting}
                                    >
                                        Chọn thành viên cụ thể
                                    </button>
                                </div>

                                {recipientMode === 'SELECTED' ? (
                                    <div className={styles.selectionPanel}>
                                        <div className={styles.selectionToolbar}>
                                            <input
                                                value={searchTerm}
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                                placeholder="Tìm theo tên hoặc mã sinh viên"
                                                disabled={isSubmitting}
                                            />
                                            <div className={styles.selectionActions}>
                                                <button type="button" className={styles.textBtn} onClick={handleSelectAllVisible} disabled={isSubmitting || selectableParticipants.length === 0}>
                                                    Chọn tất cả đang hiển thị
                                                </button>
                                                <button type="button" className={styles.textBtn} onClick={handleClearSelection} disabled={isSubmitting || selectedUserIds.length === 0}>
                                                    Bỏ chọn
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.participantList}>
                                            {selectableParticipants.length === 0 ? (
                                                <div className={styles.stateBox}>Không có thành viên phù hợp với bộ lọc hiện tại.</div>
                                            ) : selectableParticipants.map((participant) => {
                                                const checked = selectedUserIds.includes(participant.userId);
                                                return (
                                                    <label key={participant._id} className={styles.participantItem}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleRecipient(participant.userId)}
                                                            disabled={isSubmitting}
                                                        />
                                                        <div>
                                                            <strong>{participant.studentName || 'Không rõ tên'}</strong>
                                                            <span>{participant.studentCode || 'Không có mã'} {participant.className ? `• ${participant.className}` : ''}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardStep}>2</span>
                            <div>
                                <h2>Nội dung thông báo</h2>
                                <p>Thông báo này sẽ đi vào chuông notification và realtime toast nếu thành viên đang online.</p>
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="title">Tiêu đề</label>
                            <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Dời giờ tập trung trước khi diễn ra hoạt động" disabled={isSubmitting} />
                        </div>

                        <div className={styles.twoColumnGrid}>
                            <div className={styles.fieldGroup}>
                                <label htmlFor="priority">Mức ưu tiên</label>
                                <select id="priority" value={priority} onChange={(event) => setPriority(event.target.value as NotificationPriority)} disabled={isSubmitting}>
                                    {priorityOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label htmlFor="linkUrl">Link mở khi bấm thông báo</label>
                                <input id="linkUrl" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder={`/detail/${activityId || ':activityId'}`} disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="message">Nội dung</label>
                            <textarea id="message" rows={7} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nhập nội dung bạn muốn gửi tới thành viên của hoạt động" disabled={isSubmitting} />
                        </div>

                        {errorMessage && activity ? (
                            <div className={styles.errorBanner}>
                                <FontAwesomeIcon icon={faTriangleExclamation} />
                                <span>{errorMessage}</span>
                            </div>
                        ) : null}

                        <div className={styles.submitRow}>
                            <button type="submit" className={styles.primaryBtn} disabled={!canSubmit || isSubmitting}>
                                <FontAwesomeIcon icon={faPaperPlane} />
                                {isSubmitting ? 'Đang gửi...' : `Gửi cho ${totalRecipients || 0} thành viên`}
                            </button>
                        </div>
                    </section>
                </main>

                <aside className={styles.sidebar}>
                    <section className={styles.previewCard}>
                        <div className={styles.previewHeader}>
                            <FontAwesomeIcon icon={faBell} />
                            <span>Xem trước Thông báo</span>
                        </div>
                        <div className={styles.previewBody}>
                            <div className={styles.previewMeta}>
                                <strong>{currentUser?.name || activity?.organizer.name || 'Chủ hoạt động'}</strong>
                                <small>{activity?.title || 'Hoạt động'}</small>
                            </div>
                            <div className={styles.previewBadges}>
                                <span className={styles.typeBadge}>Hoạt động</span>
                                <span className={styles.priorityBadge}>{priorityOptions.find((option) => option.value === priority)?.label || priority}</span>
                            </div>
                            <h3>{title.trim() || 'Tiêu đề thông báo sẽ hiển thị ở đây'}</h3>
                            <p>{message.trim() || 'Nội dung thông báo sẽ hiển thị ở đây để bạn kiểm tra trước khi gửi.'}</p>
                        </div>
                    </section>
                </aside>
            </div>
        </form>
    );
};

export default CreateNotification;