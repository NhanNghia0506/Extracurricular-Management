import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faChartPie, faEye, faMapMarkerAlt, faBuilding, faClock } from '@fortawesome/free-solid-svg-icons';
import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './checkin.session.module.scss';
import activityService from '../../services/activity.service';
import checkinSessionService from '../../services/checkin-session.service';
import checkinService from '../../services/checkin.service';
import authService from '../../services/auth.service';
import organizerService from '../../services/organizer.service';
import type { ActivityDetailResponse } from '../../types/activity.types';
import type { CheckinSession } from '../../types/checkin-session.types';
import { resolveImageSrc } from '../../utils/image-url';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

type SessionStatus = 'ONGOING' | 'UPCOMING' | 'ENDED';

const getSessionStatus = (session: CheckinSession): SessionStatus => {
    const now = Date.now();
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();

    if (now < start) {
        return 'UPCOMING';
    }

    if (now > end) {
        return 'ENDED';
    }

    return 'ONGOING';
};

const formatDateTime = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--';
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    });
};

const buildStatusLabel = (status: SessionStatus) => {
    if (status === 'ONGOING') {
        return { text: 'ĐANG DIỄN RA', className: styles.badgeGreen };
    }

    if (status === 'UPCOMING') {
        return { text: 'SẮP TỚI', className: styles.badgeBlue };
    }

    return { text: 'ĐÃ KẾT THÚC', className: styles.badgeGray };
};

const isCountedCheckinStatus = (status?: string) => status === 'SUCCESS' || status === 'LATE';

const buildAssetUrl = resolveImageSrc;

const SessionManagement: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const activityId = searchParams.get('activityId') || searchParams.get('id') || '';
    const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
    const [sessions, setSessions] = useState<CheckinSession[]>([]);
    const [sessionCheckinTotals, setSessionCheckinTotals] = useState<Record<string, number>>({});
    const [totalRegisteredCount, setTotalRegisteredCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canManageCheckinSessions, setCanManageCheckinSessions] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!activityId) {
                setError('Thiếu activityId trong URL');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const [activityResponse, sessionsResponse] = await Promise.all([
                    activityService.getDetail(activityId),
                    checkinSessionService.listByActivityId(activityId),
                ]);

                const activityData: ActivityDetailResponse | null = activityResponse.data?.data ?? null;
                const sessionsData: CheckinSession[] = Array.isArray(sessionsResponse.data?.data)
                    ? sessionsResponse.data.data
                    : [];
                const sortedSessionsData = [...sessionsData].sort((a, b) => {
                    const aTime = new Date(a.startTime || a.createdAt || 0).getTime();
                    const bTime = new Date(b.startTime || b.createdAt || 0).getTime();
                    return bTime - aTime;
                });

                const currentUser = authService.getCurrentUser();
                const organizerId = String(activityData?.organizer?._id || '');
                let nextCanManageCheckinSessions = false;

                if (currentUser?.id && organizerId) {
                    try {
                        const myOrganizationsResponse = await organizerService.myOrganizations(currentUser.id);
                        const rows = Array.isArray(myOrganizationsResponse.data?.data)
                            ? myOrganizationsResponse.data.data
                            : [];

                        nextCanManageCheckinSessions = rows.some((row: any) => {
                            const rowOrganizerId = String(row?.organizerId?._id || row?.organizerId || '');
                            return rowOrganizerId === organizerId
                                && row?.isActive !== false
                                && row?.role === 'MANAGER';
                        });
                    } catch {
                        nextCanManageCheckinSessions = false;
                    }
                }

                setActivity(activityData);
                setSessions(sortedSessionsData);
                setCanManageCheckinSessions(nextCanManageCheckinSessions);

                try {
                    const registeredCount = await activityService.participantsCountByActivity(activityId);
                    setTotalRegisteredCount(registeredCount);
                } catch {
                    setTotalRegisteredCount(Number(activityData?.registeredCount || 0));
                }

                if (sessionsData.length > 0) {
                    const totalsEntries = await Promise.all(
                        sortedSessionsData.map(async (session) => {
                            try {
                                const result = await checkinService.getCheckinsBySessionId(session._id);
                                const countedTotal = Array.isArray(result.data)
                                    ? result.data.filter((item) => isCountedCheckinStatus(item.status)).length
                                    : 0;
                                return [session._id, countedTotal] as const;
                            } catch {
                                return [session._id, 0] as const;
                            }
                        }),
                    );

                    setSessionCheckinTotals(Object.fromEntries(totalsEntries));
                } else {
                    setSessionCheckinTotals({});
                }
            } catch (nextError: any) {
                setError(nextError?.response?.data?.message || nextError?.message || 'Không thể tải danh sách phiên điểm danh');
                setCanManageCheckinSessions(false);
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [activityId]);

    const summary = useMemo(() => {
        const totalRegistered = Number(totalRegisteredCount || activity?.registeredCount || 0);
        const totalCheckedIn = Object.values(sessionCheckinTotals).reduce((sum, value) => sum + value, 0);
        const ongoingCount = sessions.filter((session) => getSessionStatus(session) === 'ONGOING').length;

        return {
            totalRegistered,
            totalCheckedIn,
            ongoingCount,
        };
    }, [activity?.registeredCount, sessionCheckinTotals, sessions, totalRegisteredCount]);

    const handleCreateSession = () => {
        if (!activityId || !canManageCheckinSessions) {
            return;
        }

        navigate(`/configure-attendance?activityId=${activityId}`);
    };

    const handleEditSession = (sessionId: string) => {
        if (!activityId || !canManageCheckinSessions) {
            return;
        }

        navigate(`/configure-attendance?activityId=${activityId}&sessionId=${sessionId}`);
    };

    const handleOpenDashboard = (sessionId: string) => {
        navigate(`/attendance-dashboard?sessionId=${sessionId}`);
    };

    const handleOpenAttendance = (sessionId: string) => {
        navigate(`/attendance?checkinsession=${sessionId}`);
    };

    if (loading) {
        return <div className={styles.pageContainer}>Đang tải dữ liệu phiên điểm danh...</div>;
    }

    if (error) {
        return <div className={styles.pageContainer}>{error}</div>;
    }

    const activityImageUrl = buildAssetUrl(activity?.image);
    const currentUserRole = authService.getRole();
    const canOpenRealtimeDashboard = Boolean(activity?.isOwner || currentUserRole === 'ADMIN');

    return (
        <div className={styles.pageContainer}>
            {/* 1. Header Sự kiện */}
            <header className={styles.eventHeader}>
                <div className={styles.headerInfo}>
                    <div className={styles.eventThumb}>
                        {activityImageUrl ? (
                            <img src={activityImageUrl} alt={activity?.title || 'Activity'} />
                        ) : (
                            '🏛️'
                        )}
                    </div>
                    <div className={styles.eventText}>
                        <div className={styles.tags}>
                            <span className={styles.tagBlue}>PHIÊN ĐIỂM DANH</span>
                            <span className={styles.tagGray}>#{activity?.id || activityId}</span>
                        </div>
                        <h1>{activity?.title || 'Hoạt động'}</h1>
                        <div className={styles.meta}>
                            <span><FontAwesomeIcon icon={faBuilding} /> {activity?.organizer?.name || 'Ban tổ chức'}</span>
                            <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {activity?.location?.address || 'Chưa có địa điểm'}</span>
                        </div>
                    </div>
                </div>
                {canManageCheckinSessions && (
                    <button className={styles.btnCreate} onClick={handleCreateSession}>
                        <FontAwesomeIcon icon={faPlus} /> Tạo phiên điểm danh mới
                    </button>
                )}
            </header>

            {!canManageCheckinSessions && (
                <p className="small text-muted mt-2 mb-3">Chỉ MANAGER của tổ chức mới có quyền tạo hoặc chỉnh sửa phiên điểm danh.</p>
            )}

            {/* 2. Thẻ thống kê tổng quát */}
            <section className={styles.statsGrid}>
                <div className={styles.summaryCard}>
                    <label>TỔNG SINH VIÊN ĐĂNG KÝ</label>
                    <div className={styles.val}>{summary.totalRegistered}</div>
                </div>
                <div className={styles.summaryCard}>
                    <label>ĐÃ THAM GIA (TỔNG HỢP)</label>
                    <div className={styles.val}>{summary.totalCheckedIn}</div>
                </div>
                <div className={styles.summaryCard}>
                    <label>TRẠNG THÁI HOẠT ĐỘNG</label>
                    <div className={styles.statusActive}><span className={styles.dot} /> {summary.ongoingCount > 0 ? 'Có phiên đang diễn ra' : 'Không có phiên đang diễn ra'}</div>
                </div>
            </section>

            {/* 3. Danh sách các phiên */}
            <section className={styles.sessionSection}>
                <div className={styles.sectionHeader}>
                    <h2>Danh sách các phiên điểm danh</h2>
                    <div className={styles.filter}>Hiển thị: <strong>{sessions.length} phiên</strong></div>
                </div>

                {sessions.length === 0 && (
                    <div className={styles.emptyState}>Hoạt động này chưa có phiên điểm danh nào.</div>
                )}

                {sessions.map((session) => {
                    const status = getSessionStatus(session);
                    const statusInfo = buildStatusLabel(status);
                    const checkedCount = sessionCheckinTotals[session._id] || 0;
                    const totalRegistered = Number(totalRegisteredCount || activity?.registeredCount || 0);
                    const percent = totalRegistered > 0 ? Math.min(Math.round((checkedCount / totalRegistered) * 100), 100) : 0;

                    return (
                        <div
                            key={session._id}
                            className={`${styles.sessionCard} ${status === 'ONGOING' ? styles.ongoing : (status === 'UPCOMING' ? styles.upcoming : styles.ended)}`}
                            onClick={() => handleEditSession(session._id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleEditSession(session._id);
                                }
                            }}
                        >
                            <div className={styles.sessionImg}>
                                <MapContainer
                                    center={[session.location.latitude, session.location.longitude]}
                                    zoom={15}
                                    scrollWheelZoom={false}
                                    dragging={false}
                                    doubleClickZoom={false}
                                    zoomControl={false}
                                    attributionControl={false}
                                    className={styles.sessionMap}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[session.location.latitude, session.location.longitude]} />
                                    <Circle
                                        center={[session.location.latitude, session.location.longitude]}
                                        radius={session.radiusMetters}
                                        pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.18, weight: 2 }}
                                    />
                                </MapContainer>
                            </div>
                            <div className={styles.sessionContent}>
                                <div className={styles.sessionMeta}>
                                    <span className={statusInfo.className}>{statusInfo.text}</span>
                                    <span className={styles.timeLabel}>• {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                                </div>
                                <h3>{session.title}</h3>
                                <div className={styles.sessionDetails}>
                                    <span><FontAwesomeIcon icon={faClock} /> {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}</span>
                                    <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {session.location.address}</span>
                                </div>
                                <div className={styles.progressWrapper}>
                                    <div className={styles.progressLabel}>Đã điểm danh <strong>{checkedCount}/{totalRegistered || '--'} ({percent}%)</strong></div>
                                    <div className={styles.progressBar}><div style={{ width: `${percent}%` }} /></div>
                                </div>
                            </div>
                            <div className={styles.sessionActions}>
                                <div className={styles.toolButtons}>
                                    {canManageCheckinSessions && (
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleEditSession(session._id);
                                            }}
                                            title="Chỉnh sửa phiên"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    )}
                                </div>
                                {canOpenRealtimeDashboard && (
                                    <button
                                        className={styles.btnDashboard}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleOpenDashboard(session._id);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faChartPie} /> Dashboard Realtime
                                    </button>
                                )}
                                <button
                                    className={styles.btnOutline}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleOpenAttendance(session._id);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEye} /> Mở trang điểm danh
                                </button>
                            </div>
                        </div>
                    );
                })}
            </section>
        </div>
    );
};

export default SessionManagement;