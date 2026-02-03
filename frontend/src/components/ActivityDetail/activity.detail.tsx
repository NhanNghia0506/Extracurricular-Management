import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './activity.detail.module.scss';
import activityService from '../../services/activity.service';
import { ActivityDetailResponse } from '@/types/activity.types';

const locationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const ActivityDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        const fetchActivityDetail = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const response = await activityService.getDetail(id);

                // Kiểm tra nếu response.data.data tồn tại (nested data)
                const activityData = response.data.data

                setActivity(activityData);
            } catch (err: any) {
                setError(err.message || 'Không thể tải chi tiết hoạt động');
                console.error('Error fetching activity detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivityDetail();
    }, [id]);

    const handleRegister = async () => {
        if (!id) return;
        
        try {
            setRegistering(true);
            await activityService.register(id);
            alert('Đăng ký tham gia thành công!');
            // Reload lại dữ liệu để cập nhật số người đăng ký
            const response = await activityService.getDetail(id);
            setActivity(response.data.data);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không thể đăng ký. Vui lòng thử lại!');
            console.error('Error registering:', err);
        } finally {
            setRegistering(false);
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
                                    <span className={styles.name}>Dr. Sarah Jenkins</span>
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
                                {new Date(activity.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                {activity.endAt && ` - ${new Date(activity.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
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
                        <button 
                            className={styles.registerBtn}
                            onClick={handleRegister}
                            disabled={registering}
                        >
                            <i className="fa-solid fa-id-card"></i> 
                            {registering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                        </button>
                        <p className="text-center text-muted small m-0">Đăng ký kết thúc trong 2 ngày</p>
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
                            <a href="#" className="small text-primary text-decoration-none fw-bold">Lấy chỉ đường</a>
                        </div>

                        <button className={styles.actionBtnOutline}>
                            <i className="fa-regular fa-calendar-plus"></i> Thêm vào lịch
                        </button>
                        <button className={styles.actionBtnOutline}>
                            <i className="fa-solid fa-share-nodes"></i> Chia sẻ sự kiện
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ActivityDetail;