import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './feed.module.scss';

import activityService from '../../services/activity.service';
import { LocationData } from '@/types/activity.types';

interface MyActivityItem {
    _id?: string;
    activityId: string;
    title: string;
    description?: string;
    image?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
    location?: LocationData;
    trainingScore?: number;
    registeredAt?: string;
    participantStatus?: string;
    relation?: 'created' | 'participated';
}

const MyActivities: React.FC = () => {
    const [activities, setActivities] = useState<MyActivityItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    console.log('My Activities:', activities);

    const statusColorMap = useMemo(() => ({
        'ONGOING': '#10b981',
        'UPCOMING': '#2563eb',
        'OPEN': '#10b981',
        'WAITLIST': '#f59e0b',
        'ENDED': '#64748b',
        'CANCELLED': '#ef4444',
    } as Record<string, string>), []);

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
            case 'APPROVED':
                return { label: 'Đã duyệt' };
            case 'PENDING':
                return { label: 'Đang chờ duyệt' };
            case 'REJECTED':
                return { label: 'Từ chối' };
            case 'CANCELLED':
                return { label: 'Đã hủy' };
            default:
                return { label: status || 'Chưa rõ' };
        }
    };

    const getActivityId = (activity: MyActivityItem) => activity.activityId || activity._id || '';

    const createdActivities = activities.filter((activity) => activity.relation === 'created');
    const participatedActivities = activities.filter((activity) => activity.relation === 'participated');

    return (
        <div className={styles.feedContainer}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.categoryGroup}>
                    <button className={styles.active}><i className="fa-solid fa-table-cells-large"></i> All Categories</button>
                    <button><i className="fa-solid fa-laptop-code"></i> Workshop</button>
                    <button><i className="fa-solid fa-microphone"></i> Seminar</button>
                    <button><i className="fa-solid fa-basketball"></i> Sports</button>
                </div>
                <div className={styles.sortAction}>
                    <i className="fa-solid fa-arrow-down-wide-short"></i> Sort by: Date
                </div>
            </div>

            {/* Participated Activities */}
            <div className={styles.activityGrid}>
                {loading && (
                    <div>Đang tải danh sách hoạt động...</div>
                )}
                {!loading && error && (
                    <div>{error}</div>
                )}
                {!loading && !error && participatedActivities.map((act) => {
                    const statusColor = statusColorMap[act.status || ''] || '#64748b';
                    const participantStatus = mapParticipantStatus(act.participantStatus);
                    const activityId = getActivityId(act);
                    return (
                        <div key={activityId} className={styles.activityCard}>
                            <div className={`${styles.imageWrapper} ${act.status === 'ENDED' ? styles.ended : ''}`}>
                                <img src={getImageUrl(act.image)} alt={act.title} />
                                <span className={styles.statusTag} style={{ background: statusColor }}>{act.status || 'N/A'}</span>
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
                                <Link to={`/detail/${activityId}`} className={styles.actionLink}>Xem chi tiết</Link>
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
                    <div>Bạn chưa tạo hoạt động nào.</div>
                )}
                {!loading && !error && createdActivities.map((act) => {
                    const statusColor = statusColorMap[act.status || ''] || '#64748b';
                    const activityId = getActivityId(act);
                    return (
                        <div key={activityId} className={styles.activityCard}>
                            <div className={`${styles.imageWrapper} ${act.status === 'ENDED' ? styles.ended : ''}`}>
                                <img src={getImageUrl(act.image)} alt={act.title} />
                                <span className={styles.statusTag} style={{ background: statusColor }}>{act.status || 'N/A'}</span>
                                <button className={styles.saveBtn}><i className="fa-solid fa-bookmark"></i></button>
                            </div>

                            <div className={styles.cardBody}>
                                <h5>{act.title}</h5>
                                <div className={styles.infoRow}><i className="fa-regular fa-calendar"></i> {formatDateTime(act.startAt)}</div>
                                <div className={styles.infoRow}><i className="fa-solid fa-location-dot"></i> {act.location?.address || 'Chưa cập nhật'}</div>
                            </div>

                            <div className={styles.cardFooter}>
                                <span className={styles.statePill}>Bạn tạo</span>
                                <Link to={`/detail/${activityId}`} className={styles.actionLink}>Xem chi tiết</Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyActivities;