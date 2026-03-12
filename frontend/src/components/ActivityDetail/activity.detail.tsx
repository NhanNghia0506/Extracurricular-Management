import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './activity.detail.module.scss';
import activityService from '../../services/activity.service';
import checkinSessionService from '../../services/checkin-session.service';
import conversationService from '../../services/conversation.service';
import { ActivityDetailResponse } from '@/types/activity.types';
import { CheckinSession } from '@/types/checkin-session.types';
import { formatTime } from '../../utils/date-time';
import CreateConversation from '../CreateConversation/create.conversation';
import authService from '../../services/auth.service';

const locationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface ConversationStateSnapshot {
    hasConversation: boolean;
    conversationId: string | null;
    isConversationMember: boolean;
}

const getConversationState = async (
    activityId: string,
    currentUserId?: string,
): Promise<ConversationStateSnapshot> => {
    try {
        const conversationResponse = await conversationService.getByActivity(activityId);
        const conversationData = conversationResponse.data?.data ?? conversationResponse.data;
        const nextConversationId = String(conversationData?._id || conversationData?.id || '');

        if (!nextConversationId) {
            return {
                hasConversation: false,
                conversationId: null,
                isConversationMember: false,
            };
        }

        if (!currentUserId) {
            return {
                hasConversation: true,
                conversationId: nextConversationId,
                isConversationMember: false,
            };
        }

        const membersResponse = await conversationService.getMembers(nextConversationId);
        const members = membersResponse.data?.data ?? membersResponse.data ?? [];
        const joined = Array.isArray(members) && members.some((member) => {
            const memberUserId = member?.userId?._id || member?.userId?.id || member?.userId;
            return String(memberUserId) === String(currentUserId);
        });

        return {
            hasConversation: true,
            conversationId: nextConversationId,
            isConversationMember: joined,
        };
    } catch (convErr: any) {
        if (convErr.response?.status === 404) {
            return {
                hasConversation: false,
                conversationId: null,
                isConversationMember: false,
            };
        }

        throw convErr;
    }
};

const ActivityDetail: React.FC = () => {
    const deleteNoticePeriodInMs = 2 * 24 * 60 * 60 * 1000;
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registering, setRegistering] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showCreateChatModal, setShowCreateChatModal] = useState(false);
    const [showRegisterConfirmModal, setShowRegisterConfirmModal] = useState(false);
    const [showJoinChatPromptModal, setShowJoinChatPromptModal] = useState(false);
    const [hasConversation, setHasConversation] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isConversationMember, setIsConversationMember] = useState(false);
    const [joiningConversation, setJoiningConversation] = useState(false);
    const [checkinSession, setCheckinSession] = useState<CheckinSession | null>(null);

    const currentUser = authService.getCurrentUser();
    const currentUserId = currentUser?.id as string | undefined;

    const loadConversationState = async (activityId: string) => {
        try {
            const nextState = await getConversationState(activityId, currentUserId);
            setHasConversation(nextState.hasConversation);
            setConversationId(nextState.conversationId);
            setIsConversationMember(nextState.isConversationMember);
            return nextState;
        } catch (convErr: any) {
            console.error('Error loading conversation state:', convErr);
            return {
                hasConversation: false,
                conversationId: null,
                isConversationMember: false,
            };
        }
    };

    const loadCheckinSession = async (activityId: string) => {
        try {
            const response = await checkinSessionService.getByActivityId(activityId);
            const nextSession = response.data?.data ?? null;
            setCheckinSession(nextSession);
            return nextSession;
        } catch (sessionErr: any) {
            if (sessionErr.response?.status === 404) {
                setCheckinSession(null);
                return null;
            }

            console.error('Error loading checkin session:', sessionErr);
            setCheckinSession(null);
            return null;
        }
    };

    useEffect(() => {
        const fetchActivityDetail = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const response = await activityService.getDetail(id);

                // Kiểm tra nếu response.data.data tồn tại (nested data)
                const activityData = response.data.data;

                setActivity(activityData);
                const nextConversationState = await getConversationState(id, currentUserId);
                setHasConversation(nextConversationState.hasConversation);
                setConversationId(nextConversationState.conversationId);
                setIsConversationMember(nextConversationState.isConversationMember);
                await loadCheckinSession(id);
            } catch (err: any) {
                setError(err.message || 'Không thể tải chi tiết hoạt động');
                console.error('Error fetching activity detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivityDetail();
    }, [id, currentUserId]);

    const handleRegister = async () => {
        if (!id) return;

        if (!currentUserId) {
            alert('Vui lòng đăng nhập để đăng ký tham gia hoạt động.');
            return;
        }

        try {
            setRegistering(true);
            await activityService.register(id);
            setShowRegisterConfirmModal(false);

            const response = await activityService.getDetail(id);
            setActivity(response.data.data);
            const nextConversationState = await loadConversationState(id);

            if (nextConversationState.hasConversation && nextConversationState.conversationId) {
                setShowJoinChatPromptModal(true);
            } else {
                alert('Đăng ký tham gia thành công!');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không thể đăng ký. Vui lòng thử lại!');
            console.error('Error registering:', err);
        } finally {
            setRegistering(false);
        }
    };

    const handleJoinConversation = async () => {
        if (!conversationId) {
            return;
        }

        if (!currentUserId) {
            alert('Vui lòng đăng nhập để tham gia nhóm chat.');
            return;
        }

        try {
            setJoiningConversation(true);

            if (!isConversationMember) {
                await conversationService.addMember(conversationId, currentUserId);
                setIsConversationMember(true);
            }

            setShowJoinChatPromptModal(false);
            navigate(`/chat?Id=${conversationId}`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không thể tham gia nhóm chat. Vui lòng thử lại!');
            console.error('Error joining conversation:', err);
        } finally {
            setJoiningConversation(false);
        }
    };

    const handleConfigureAttendance = () => {
        if (!id) return;
        navigate(`/configure-attendance?activityId=${id}`);
    };

    const handleGoToUpdate = () => {
        if (!id) return;
        navigate(`/update-activity?activityId=${id}`);
    };

    const handleGoToAttendanceDashboard = () => {
        if (!checkinSession?._id) {
            alert('Hoạt động này chưa có phiên điểm danh để xem dashboard.');
            return;
        }

        navigate(`/attendance-dashboard?sessionId=${checkinSession._id}`);
    };

    const handleGoToCreateNotification = () => {
        if (!id) {
            return;
        }

        navigate(`/create-notification?activityId=${id}`);
    };

    const handleDelete = async () => {
        if (!id || !activity?.canDelete || deleting) return;

        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn xóa hoạt động này? Dữ liệu đăng ký tham gia của hoạt động cũng sẽ bị xóa.'
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            await activityService.delete(id);
            alert('Xóa hoạt động thành công!');
            navigate('/my-activities');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không thể xóa hoạt động. Vui lòng thử lại!');
            console.error('Error deleting activity:', err);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div className="text-center py-5">Đang tải...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;
    if (!activity || !activity.category || !activity.organizer) {
        return <div className="text-center py-5">Không tìm thấy hoạt động</div>;
    }

    const campusLocation: LatLngExpression = activity.location
        ? [activity.location.latitude, activity.location.longitude]
        : [10.76, 106.66]; // Default location nếu không có
    const currentUserRole = authService.getRole();
    const canManageDeletion = activity.isOwner || currentUserRole === 'ADMIN';
    const isApproved = activity.approvalStatus === 'APPROVED';
    const needsEdit = activity.approvalStatus === 'NEEDS_EDIT';
    const canAccessChat = hasConversation && (activity.isOwner || currentUserRole === 'ADMIN' || activity.isRegistered);
    const deleteDeadline = new Date(new Date(activity.startAt).getTime() - deleteNoticePeriodInMs);
    const directionsUrl = activity.location
        ? `https://www.google.com/maps/search/?api=1&query=${activity.location.latitude},${activity.location.longitude}`
        : 'https://www.google.com/maps';

    return (
        <div className={styles.detailPage}>
            {/* 1. Banner Image */}
            <div className={styles.bannerWrapper}>
                <img
                    src={activity.image
                        ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/uploads/${activity.image}`
                        : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070'
                    }
                    alt={activity.title}
                />
                <span className={styles.categoryBadge}>{activity.category.name}</span>
            </div>

            <div className={styles.contentGrid}>
                {/* 2. Cột trái: Nội dung chính */}
                <main className={styles.mainContent}>
                    <section className={styles.whiteCard}>
                        <div className={styles.headerInfo}>
                            <h1>{activity.title}</h1>
                            <p className={styles.hostText}>Tổ chức bởi {activity.organizer.name}</p>
                            <span className={styles.upcomingBadge}>● {activity.status}</span>
                        </div>

                        <div className={styles.hostProfile}>
                            <div className={styles.profileLeft}>
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Dr. Sarah" />
                                <div>
                                    <span className={styles.name}>{activity.organizer.name}</span>
                                    <span className={styles.title}>Event Coordinator & Associate Professor</span>
                                </div>
                            </div>
                            <button className={styles.chatBtn}><i className="fa-regular fa-comment-dots"></i></button>
                        </div>
                    </section>

                    {/* Grid thông tin nhanh */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoBox}>
                            <div className={styles.icon}><i className="fa-regular fa-calendar"></i></div>
                            <label>Ngày & Giờ</label>
                            <p>{new Date(activity.startAt).toLocaleDateString('vi-VN')}</p>
                            <small>
                                {formatTime(activity.startAt)}
                                {activity.endAt && ` - ${formatTime(activity.endAt)}`}
                            </small>
                        </div>
                        <div className={styles.infoBox}>
                            <div className={styles.icon}><i className="fa-solid fa-location-dot"></i></div>
                            <label>Địa điểm</label>
                            <p>{activity.location?.address || 'Chưa xác định'}</p>
                            <small>{activity.location?.latitude}, {activity.location?.longitude}</small>
                        </div>
                        <div className={styles.infoBox}>
                            <div className={styles.icon}><i className="fa-solid fa-shapes"></i></div>
                            <label>Loại hoạt động</label>
                            <p>{activity.category.name}</p>
                            <small>{activity.trainingScore ? `Nhận ${activity.trainingScore} điểm` : 'Không có điểm'}</small>
                        </div>
                    </div>

                    <section className={styles.whiteCard}>
                        <h5 className="fw-bold mb-3">Về hoạt động</h5>
                        <div className="text-muted" style={{ lineHeight: '1.7' }}>
                            <p>{activity.description}</p>
                        </div>

                        {needsEdit && activity.reviewNote && (
                            <div className={styles.reviewNoteBox}>
                                <div className={styles.reviewNoteTitle}>
                                    <i className="fa-solid fa-pen-to-square"></i>
                                    Yêu cầu chỉnh sửa từ quản trị viên
                                </div>
                                <p className="m-0">{activity.reviewNote}</p>
                            </div>
                        )}

                        <div className={styles.noticeBox}>
                            <i className="fa-solid fa-circle-info"></i>
                            <p className="m-0">Điểm danh sẽ được theo dõi qua GPS. Vui lòng bật dịch vụ định vị trên ứng dụng UniActivity khi đến nơi.</p>
                        </div>
                    </section>
                </main>

                {/* 3. Cột phải: Sidebar hành động */}
                <aside className={styles.sidebar}>
                    <div className={`${styles.whiteCard} ${styles.registrationCard}`}>
                        <h6 className="fw-bold mb-3">Trạng thái đăng ký</h6>
                        <div className={styles.statusRow}>
                            <div className={styles.count}>
                                {activity.registeredCount}
                                <span>/{activity.participantCount || 'Không giới hạn'}</span>
                            </div>
                            <div className={styles.percent}>
                                {activity.participantCount
                                    ? `${Math.round((activity.registeredCount / activity.participantCount) * 100)}% Đầy`
                                    : `${activity.registeredCount} người đã đăng ký`
                                }
                            </div>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: activity.participantCount
                                        ? `${(activity.registeredCount / activity.participantCount) * 100}%`
                                        : '0%'
                                }}
                            ></div>
                        </div>
                        {activity.isOwner ? (
                            <>
                                {isApproved && (
                                    <button
                                        className={styles.registerBtn}
                                        onClick={handleConfigureAttendance}
                                    >
                                        <i className="fa-solid fa-gear"></i>
                                        Cấu hình điểm danh
                                    </button>
                                )}
                                {isApproved && !hasConversation && (
                                    <button
                                        className={styles.registerBtn}
                                        onClick={() => setShowCreateChatModal(true)}
                                        style={{ marginTop: '10px' }}
                                    >
                                        <i className="fa-solid fa-comments"></i>
                                        Tạo nhóm chat
                                    </button>
                                )}
                                {needsEdit && (
                                    <button
                                        className={styles.registerBtn}
                                        onClick={handleGoToUpdate}
                                    >
                                        <i className="fa-solid fa-pen-to-square"></i>
                                        Chỉnh sửa hoạt động
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    className={styles.registerBtn}
                                    onClick={() => setShowRegisterConfirmModal(true)}
                                    disabled={registering || activity.isRegistered}
                                >
                                    <i className="fa-solid fa-id-card"></i>
                                    {activity.isRegistered
                                        ? 'Đã đăng ký'
                                        : registering ? 'Đang đăng ký...' : 'Đăng ký ngay'
                                    }
                                </button>
                            </>
                        )}
                        {(activity.isOwner || canAccessChat || activity.canDelete) && (
                            <div className={styles.iconActionRow}>
                                {activity.isOwner && (
                                    <button
                                        className={styles.iconActionBtn}
                                        onClick={handleGoToCreateNotification}
                                        title="Gửi thông báo cho thành viên"
                                        aria-label="Gửi thông báo cho thành viên"
                                    >
                                        <i className="fa-regular fa-bell"></i>
                                    </button>
                                )}
                                {canAccessChat && (
                                    <button
                                        className={styles.iconActionBtn}
                                        onClick={handleJoinConversation}
                                        disabled={joiningConversation}
                                        title={joiningConversation
                                            ? 'Đang vào nhóm chat...'
                                            : isConversationMember ? 'Mở nhóm chat' : 'Tham gia nhóm chat'}
                                        aria-label={joiningConversation
                                            ? 'Đang vào nhóm chat'
                                            : isConversationMember ? 'Mở nhóm chat' : 'Tham gia nhóm chat'}
                                    >
                                        <i className="fa-solid fa-comments"></i>
                                    </button>
                                )}
                                {activity.canDelete && (
                                    <button
                                        className={styles.iconActionBtn}
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        title={deleting ? 'Đang xóa...' : 'Xóa hoạt động'}
                                        aria-label={deleting ? 'Đang xóa hoạt động' : 'Xóa hoạt động'}
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                )}
                            </div>
                        )}
                        {isApproved && canManageDeletion && !activity.canDelete && (
                            <p className={styles.deleteHint}>
                                Chỉ được xóa hoạt động trước ngày diễn ra ít nhất 2 ngày.
                                Hạn xóa: {deleteDeadline.toLocaleDateString('vi-VN')} {formatTime(deleteDeadline.toISOString())}
                            </p>
                        )}
                        {/* <p className="text-center text-muted small m-0">Đăng ký kết thúc trong 2 ngày</p> */}
                    </div>

                    <div className={styles.whiteCard}>
                        <div className={styles.miniMap}>
                            <MapContainer
                                center={campusLocation}
                                zoom={15}
                                className={styles.leafletMap}
                                scrollWheelZoom={false}
                                dragging={false}
                                doubleClickZoom={false}
                                zoomControl={false}
                                attributionControl={false}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={campusLocation} icon={locationIcon}>
                                    <Popup>{activity.location?.address || 'Địa điểm sự kiện'}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="small fw-bold text-muted">
                                <i className="fa-solid fa-location-arrow me-1"></i>
                                {activity.location?.address || 'Địa điểm sự kiện'}
                            </span>
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="small text-primary text-decoration-none fw-bold"
                            >
                                Lấy chỉ đường
                            </a>
                        </div>

                        <button
                            className={styles.actionBtnOutline}
                            onClick={handleGoToAttendanceDashboard}
                            disabled={!checkinSession?._id}
                            title={!checkinSession?._id ? 'Hoạt động chưa có phiên điểm danh' : undefined}
                        >
                            <i className="fa-solid fa-chart-line"></i> Dashboard điểm danh
                        </button>
                        <button className={styles.actionBtnOutline}>
                            <i className="fa-solid fa-share-nodes"></i> Chia sẻ sự kiện
                        </button>
                    </div>
                </aside>
            </div>

            {showCreateChatModal && (
                <CreateConversation
                    onClose={() => setShowCreateChatModal(false)}
                    activityId={id}
                    activityTitle={activity.title}
                    onSuccess={() => {
                        if (id) {
                            loadConversationState(id);
                        }
                    }}
                />
            )}

            {showRegisterConfirmModal && (
                <div className={styles.modalOverlay} onClick={() => !registering && setShowRegisterConfirmModal(false)}>
                    <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Xác nhận đăng ký</h3>
                            <button
                                type="button"
                                className={styles.modalCloseBtn}
                                onClick={() => setShowRegisterConfirmModal(false)}
                                disabled={registering}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <p className={styles.modalBodyText}>
                            Bạn có chắc muốn đăng ký tham gia hoạt động <strong>{activity.title}</strong> không?
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalSecondaryBtn}
                                onClick={() => setShowRegisterConfirmModal(false)}
                                disabled={registering}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className={styles.modalPrimaryBtn}
                                onClick={handleRegister}
                                disabled={registering}
                            >
                                {registering ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showJoinChatPromptModal && canAccessChat && (
                <div className={styles.modalOverlay} onClick={() => !joiningConversation && setShowJoinChatPromptModal(false)}>
                    <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Tham gia nhóm chat</h3>
                            <button
                                type="button"
                                className={styles.modalCloseBtn}
                                onClick={() => setShowJoinChatPromptModal(false)}
                                disabled={joiningConversation}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <p className={styles.modalBodyText}>
                            Bạn đã đăng ký thành công. Hoạt động này đã có nhóm chat, bạn có muốn tham gia ngay không?
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalSecondaryBtn}
                                onClick={() => setShowJoinChatPromptModal(false)}
                                disabled={joiningConversation}
                            >
                                Để sau
                            </button>
                            <button
                                type="button"
                                className={styles.modalPrimaryBtn}
                                onClick={handleJoinConversation}
                                disabled={joiningConversation}
                            >
                                {joiningConversation ? 'Đang tham gia...' : 'Tham gia nhóm chat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityDetail;