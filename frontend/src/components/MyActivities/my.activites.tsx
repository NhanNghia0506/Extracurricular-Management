import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './feed.module.scss';

import activityService from '../../services/activity.service';
import { LocationData } from '@/types/activity.types';

interface MyActivityItem {
    _id?: string;
    participantId?: string;
    activityId: string;
    title: string;
    description?: string;
    image?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
    approvalStatus?: string;
    location?: LocationData;
    trainingScore?: number;
    registeredAt?: string;
    participantStatus?: string;
    relation?: 'created' | 'participated';
}

type StatusFilterKey =
    | 'ALL'
    | 'PENDING'
    | 'NEEDS_EDIT'
    | 'REJECTED'
    | 'OPEN'
    | 'ONGOING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'CLOSED';

interface StatusPresentation {
    label: string;
    color: string;
}

interface MyActivitiesProps {
    searchTerm?: string;
}

const MyActivities: React.FC<MyActivitiesProps> = ({ searchTerm = '' }) => {
    const [activities, setActivities] = useState<MyActivityItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterKey>('ALL');

    useEffect(() => {
        const fetchMyActivities = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await activityService.myActivities();
                const data = response.data?.data || [];
                setActivities(Array.isArray(data) ? data : []);
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Không thể tải danh sách hoạt động');
            } finally {
                setLoading(false);
            }
        };

        fetchMyActivities();
    }, []);

    const handleCancelRegistration = async (participantId?: string) => {
        if (!participantId) {
            alert('Không tìm thấy thông tin đăng ký để hủy.');
            return;
        }

        const confirmed = window.confirm('Bạn có chắc muốn hủy đăng ký hoạt động này?');
        if (!confirmed) {
            return;
        }

        try {
            await activityService.cancelRegistration(participantId);
            setActivities((prev) => prev.map((item) => (
                item.participantId === participantId
                    ? { ...item, participantStatus: 'CANCELLED' }
                    : item
            )));
            alert('Đã hủy đăng ký thành công');
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Không thể hủy đăng ký. Vui lòng thử lại!');
        }
    };

    const statusPresentationMap = useMemo(() => ({
        PENDING: { label: 'Chờ phê duyệt', color: '#f59e0b' },
        NEEDS_EDIT: { label: 'Cần chỉnh sửa', color: '#f97316' },
        REJECTED: { label: 'Bị từ chối', color: '#ef4444' },
        OPEN: { label: 'Đang mở đăng ký', color: '#10b981' },
        ONGOING: { label: 'Đang diễn ra', color: '#2563eb' },
        COMPLETED: { label: 'Đã hoàn thành', color: '#64748b' },
        CANCELLED: { label: 'Đã hủy', color: '#dc2626' },
        CLOSED: { label: 'Đã đóng đăng ký', color: '#7c3aed' },
    } as Record<Exclude<StatusFilterKey, 'ALL'>, StatusPresentation>), []);

    const statusFilterConfig = useMemo(() => ([
        { key: 'ALL' as const, label: 'Tất cả trạng thái', icon: 'fa-table-cells-large' },
        { key: 'PENDING' as const, label: 'Chờ duyệt', icon: 'fa-hourglass-half' },
        { key: 'NEEDS_EDIT' as const, label: 'Cần sửa', icon: 'fa-pen-to-square' },
        { key: 'OPEN' as const, label: 'Mở đăng ký', icon: 'fa-door-open' },
        { key: 'ONGOING' as const, label: 'Đang diễn ra', icon: 'fa-person-running' },
        { key: 'COMPLETED' as const, label: 'Đã hoàn thành', icon: 'fa-circle-check' },
        { key: 'CANCELLED' as const, label: 'Đã hủy', icon: 'fa-ban' },
        { key: 'REJECTED' as const, label: 'Bị từ chối', icon: 'fa-circle-xmark' },
    ]), []);

    const getActivityStatusKey = useMemo(() => (activity: MyActivityItem): StatusFilterKey => {
        if (activity.relation === 'created') {
            if (activity.approvalStatus === 'PENDING') return 'PENDING';
            if (activity.approvalStatus === 'NEEDS_EDIT') return 'NEEDS_EDIT';
            if (activity.approvalStatus === 'REJECTED') return 'REJECTED';
        }

        switch (activity.status) {
            case 'OPEN':
                return 'OPEN';
            case 'ONGOING':
                return 'ONGOING';
            case 'COMPLETED':
                return 'COMPLETED';
            case 'CANCELLED':
                return 'CANCELLED';
            case 'CLOSED':
                return 'CLOSED';
            default:
                return 'ALL';
        }
    }, []);

    const getStatusPresentation = useMemo(() => (activity: MyActivityItem): StatusPresentation => {
        const statusKey = getActivityStatusKey(activity);

        if (statusKey === 'ALL') {
            return { label: 'Chưa cập nhật', color: '#64748b' };
        }

        return statusPresentationMap[statusKey];
    }, [getActivityStatusKey, statusPresentationMap]);

    const formatDateTime = (value?: string) => {
        if (!value) return 'Chưa cập nhật';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getImageUrl = (image?: string) => {
        if (!image) {
            return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1974';
        }
        if (image.startsWith('http')) return image;
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
        return `${baseUrl}/uploads/${image}`;
    };

    const mapParticipantStatus = (status?: string) => {
        switch (status) {
            case 'REGISTERED':
                return { label: 'Đã đăng ký' };
            case 'APPROVED':
                return { label: 'Đã đăng ký' };
            case 'PENDING':
                return { label: 'Danh sách chờ' };
            case 'REJECTED':
                return { label: 'Bị từ chối' };
            case 'CANCELLED':
                return { label: 'Đã hủy' };
            default:
                return { label: 'Đã đăng ký' };
        }
    };

    const getActivityId = (activity: MyActivityItem) => activity.activityId || activity._id || '';

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredByKeyword = useMemo(() => {
        if (!normalizedSearchTerm) {
            return activities;
        }

        return activities.filter((activity) => [
            activity.title,
            activity.description,
            activity.location?.address,
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearchTerm)));
    }, [activities, normalizedSearchTerm]);

    const filteredByStatus = useMemo(() => {
        if (activeStatusFilter === 'ALL') {
            return filteredByKeyword;
        }

        return filteredByKeyword.filter((activity) => getActivityStatusKey(activity) === activeStatusFilter);
    }, [filteredByKeyword, activeStatusFilter, getActivityStatusKey]);

    const filterCounts = useMemo(() => {
        const counts = activities.reduce<Record<StatusFilterKey, number>>((accumulator, activity) => {
            const key = getActivityStatusKey(activity);
            accumulator.ALL += 1;
            accumulator[key] += 1;
            return accumulator;
        }, {
            ALL: 0,
            PENDING: 0,
            NEEDS_EDIT: 0,
            REJECTED: 0,
            OPEN: 0,
            ONGOING: 0,
            COMPLETED: 0,
            CANCELLED: 0,
            CLOSED: 0,
        });

        return counts;
    }, [activities, getActivityStatusKey]);

    const createdActivities = filteredByStatus.filter((activity) => activity.relation === 'created');
    const participatedActivities = filteredByStatus.filter((activity) => activity.relation === 'participated');

    return (
        <div className={styles.feedContainer}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.categoryGroup}>
                    {statusFilterConfig
                        .filter((item) => item.key === 'ALL' || filterCounts[item.key] > 0)
                        .map((item) => (
                            <button
                                key={item.key}
                                className={activeStatusFilter === item.key ? styles.active : ''}
                                onClick={() => setActiveStatusFilter(item.key)}
                            >
                                <i className={`fa-solid ${item.icon}`}></i>
                                {item.label} ({filterCounts[item.key]})
                            </button>
                        ))}
                </div>
                <div className={styles.sortAction}>
                    <i className="fa-solid fa-arrow-down-wide-short"></i> Lọc theo trạng thái
                </div>
            </div>

            <div className={styles.sectionTitle}>
                <i className="fa-solid fa-user-check"></i>
                <span>Hoạt động bạn tham gia</span>
                <span className={styles.badge}>{participatedActivities.length}</span>
            </div>

            {/* Participated Activities */}
            <div className={styles.activityGrid}>
                {loading && (
                    <div>Đang tải danh sách hoạt động...</div>
                )}
                {!loading && error && (
                    <div>{error}</div>
                )}
                {!loading && !error && participatedActivities.length === 0 && (
                    <div>
                        {normalizedSearchTerm
                            ? `Không có hoạt động tham gia nào phù hợp với từ khóa "${searchTerm.trim()}".`
                            : 'Không có hoạt động tham gia nào phù hợp với trạng thái đang chọn.'}
                    </div>
                )}
                {!loading && !error && participatedActivities.map((act) => {
                    const statusPresentation = getStatusPresentation(act);
                    const participantStatus = mapParticipantStatus(act.participantStatus);
                    const activityId = getActivityId(act);
                    const canOpenFeedback = getActivityStatusKey(act) !== 'COMPLETED';
                    const canCancelRegistration = act.participantStatus === 'REGISTERED' || act.participantStatus === 'PENDING' || act.participantStatus === 'APPROVED';
                    return (
                        <div key={activityId} className={styles.activityCard}>
                            <div className={`${styles.imageWrapper} ${act.status === 'COMPLETED' ? styles.ended : ''}`}>
                                <img src={getImageUrl(act.image)} alt={act.title} />
                                <span className={styles.statusTag} style={{ background: statusPresentation.color }}>{statusPresentation.label}</span>
                                <button className={styles.saveBtn}><i className="fa-solid fa-bookmark"></i></button>
                            </div>

                            <div className={styles.cardBody}>
                                <h5>{act.title}</h5>
                                <div className={styles.infoRow}><i className="fa-regular fa-calendar"></i> {formatDateTime(act.startAt)}</div>
                                <div className={styles.infoRow}><i className="fa-solid fa-location-dot"></i> {act.location?.address || 'Chưa cập nhật'}</div>
                            </div>

                            <div className={styles.cardFooter}>
                                <span className={styles.statePill}>
                                    {participantStatus.label}
                                </span>
                                <div className="d-flex align-items-center gap-2">
                                    {canCancelRegistration && (
                                        <button
                                            type="button"
                                            className={styles.cancelActionBtn}
                                            onClick={() => handleCancelRegistration(act.participantId)}
                                        >
                                            Hủy đăng ký
                                        </button>
                                    )}
                                    {canOpenFeedback && (
                                        <Link to={`/activity-detail?id=${activityId}#feedback`} className={styles.actionLink}>Đánh giá</Link>
                                    )}
                                    <Link to={`/activity-detail?id=${activityId}`} className={styles.actionLink}>Xem chi tiết</Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Created Activities */}
            <div className={styles.sectionTitle}>
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Hoạt động của bạn</span>
                <span className={styles.badge}>{createdActivities.length}</span>
            </div>
            <div className={styles.activityGrid}>
                {loading && (
                    <div>Đang tải danh sách hoạt động...</div>
                )}
                {!loading && error && (
                    <div>{error}</div>
                )}
                {!loading && !error && createdActivities.length === 0 && (
                    <div>
                        {normalizedSearchTerm
                            ? `Không có hoạt động bạn tạo nào phù hợp với từ khóa "${searchTerm.trim()}".`
                            : 'Không có hoạt động bạn tạo nào phù hợp với trạng thái đang chọn.'}
                    </div>
                )}
                {!loading && !error && createdActivities.map((act) => {
                    const statusPresentation = getStatusPresentation(act);
                    const activityId = getActivityId(act);
                    return (
                        <div key={activityId} className={styles.activityCard}>
                            <div className={`${styles.imageWrapper} ${act.status === 'COMPLETED' ? styles.ended : ''}`}>
                                <img src={getImageUrl(act.image)} alt={act.title} />
                                <span className={styles.statusTag} style={{ background: statusPresentation.color }}>{statusPresentation.label}</span>
                                <button className={styles.saveBtn}><i className="fa-solid fa-bookmark"></i></button>
                            </div>

                            <div className={styles.cardBody}>
                                <h5>{act.title}</h5>
                                <div className={styles.infoRow}><i className="fa-regular fa-calendar"></i> {formatDateTime(act.startAt)}</div>
                                <div className={styles.infoRow}><i className="fa-solid fa-location-dot"></i> {act.location?.address || 'Chưa cập nhật'}</div>
                            </div>

                            <div className={styles.cardFooter}>
                                <span className={styles.statePill}>Bạn tạo</span>
                                <Link to={`/activity-detail?id=${activityId}`} className={styles.actionLink}>Xem chi tiết</Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyActivities;