import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from './attendance.module.scss';
import AttendanceMap from './attendance.map';
import checkinSessionService from '../../services/checkin-session.service';
import type { CheckinSession } from '@/types/checkin-session.types';

const Attendance: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [checkinSession, setCheckinSession] = useState<CheckinSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCheckinLoading, setIsCheckinLoading] = useState(false);
    const [checkinError, setCheckinError] = useState<string | null>(null);
    const [checkinSuccess, setCheckinSuccess] = useState(false);
    const [hasCheckinSuccessfully, setHasCheckinSuccessfully] = useState(false);

    useEffect(() => {
        const fetchCheckinSession = async () => {
            try {
                const checkinsessionId = searchParams.get('checkinsession');
                if (!checkinsessionId) {
                    setError('Không tìm thấy checkin session ID trong URL');
                    setLoading(false);
                    return;
                }

                const response = await checkinSessionService.getById(checkinsessionId);
                setCheckinSession(response.data.data);
            } catch (err) {
                setError('Lỗi khi tải thông tin checkin session');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCheckinSession();
    }, [searchParams]);

    const handleCheckin = async () => {
        if (!checkinSession?._id) return;

        setIsCheckinLoading(true);
        setCheckinError(null);
        setCheckinSuccess(false);

        try {
            // Lấy vị trí của người dùng
            const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve(pos.coords),
                    (err) => reject(err)
                );
            });

            // Submit dữ liệu với vị trí
            const response = await checkinSessionService.checkin(
                checkinSession._id,
                position.latitude,
                position.longitude
            );

            const checkinData = response.data.data;

            if (checkinData.status === 'SUCCESS') {
                // Điểm danh thành công
                setCheckinSuccess(true);
                setHasCheckinSuccessfully(true);

                // Quay về trang trước sau 2 giây
                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            } else if (checkinData.status === 'FAILED') {
                // Điểm danh thất bại - hiển thị lý do
                const failReason = checkinData.failReason || 'Không rõ nguyên nhân thất bại';
                setCheckinError(`Điểm danh thất bại: ${failReason}`);
            }
        } catch (err) {
            if (err instanceof GeolocationPositionError) {
                setCheckinError('Không thể lấy vị trí. Vui lòng kiểm tra quyền GPS!');
            } else {
                setCheckinError('Lỗi khi điểm danh. Vui lòng thử lại!');
            }
            console.error(err);
        } finally {
            setIsCheckinLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.attendanceContainer}>
                <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !checkinSession) {
        return (
            <div className={styles.attendanceContainer}>
                <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
                    <div className="alert alert-danger" role="alert">
                        {error || 'Không tìm thấy checkin session'}
                    </div>
                </div>
            </div>
        );
    }

    if (!checkinSession.location) {
        return (
            <div className={styles.attendanceContainer}>
                <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
                    <div className="alert alert-danger" role="alert">
                        Dữ liệu vị trí không hợp lệ
                    </div>
                </div>
            </div>
        );
    }

    const startTime = new Date(checkinSession.startTime);
    const endTime = new Date(checkinSession.endTime);
    const now = new Date();
    const isOngoing = now >= startTime && now <= endTime;
    const hasNotStarted = now < startTime;
    const hasEnded = now > endTime;

    return (
        <div className={styles.attendanceContainer}>

            {/* CỘT TRÁI: BẢN ĐỒ */}
            <AttendanceMap
                attendanceLocation={[checkinSession.location.latitude, checkinSession.location.longitude]}
                attendanceLocationName={checkinSession.location.address}
                attendanceRadius={checkinSession.radiusMetters}
            />

            {/* CỘT PHẢI: CHI TIẾT */}
            <aside className={styles.infoColumn}>

                {/* Section 1: Current Session */}
                <div>
                    <h6 className="text-muted small fw-bold mb-3 uppercase">Phiên hiện tại</h6>
                    <div className={styles.sessionCard}>
                        <div className={styles.sessionImg}>
                            <span className={isOngoing ? styles.badgeOngoing : (hasNotStarted ? styles.badgeNotStarted : styles.badgeEnded)}>
                                {isOngoing ? 'ĐANG DIỄN RA' : (hasNotStarted ? 'CHƯA DIỄN RA' : 'ĐÃ KẾT THÚC')}
                            </span>
                        </div>
                        <div className={styles.sessionBody}>
                            <h5>Phiên điểm danh</h5>
                            <span className={styles.location}>
                                <i className="fa-solid fa-book-bookmark me-2"></i>
                                {checkinSession.location.address}
                            </span>

                            <div className="d-flex justify-content-between mb-3">
                                <div>
                                    <small className="text-muted d-block">THỜI GIAN BẮT ĐẦU</small>
                                    <span className="fw-bold small">{startTime.toLocaleTimeString('vi-VN')}</span>
                                </div>
                                <div>
                                    <small className="text-muted d-block">THỜI GIAN KẾT THÚC</small>
                                    <span className="fw-bold small">{endTime.toLocaleTimeString('vi-VN')}</span>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between mb-3">
                                <div>
                                    <small className="text-muted d-block">BÁN KÍNH</small>
                                    <span className="fw-bold small">{checkinSession.radiusMetters}m</span>
                                </div>
                            </div>

                            <div className={styles.infoBox}>
                                <i className="fa-solid fa-circle-info mt-1"></i>
                                <p className="m-0">Bạn phải nằm trong vòng bán kính {checkinSession.radiusMetters}m để có thể điểm danh.</p>
                            </div>

                            <button
                                className={styles.checkinBtn}
                                disabled={!isOngoing || isCheckinLoading || hasCheckinSuccessfully}
                                onClick={handleCheckin}
                            >
                                <i className="fa-solid fa-fingerprint"></i>
                                {hasCheckinSuccessfully ? 'Đã điểm danh' : (isCheckinLoading ? 'Đang điểm danh...' : (isOngoing ? 'Vào khu vực để điểm danh' : (hasNotStarted ? 'Chưa tới thời gian điểm danh' : 'Điểm danh đã kết thúc')))}
                            </button>

                            {checkinSuccess && (
                                <div className="alert alert-success mt-3 mb-0" role="alert">
                                    <i className="fa-solid fa-check-circle me-2"></i>
                                    Điểm danh thành công! Đang quay lại...
                                </div>
                            )}

                            {checkinError && (
                                <div className="alert alert-danger mt-3 mb-0" role="alert">
                                    <i className="fa-solid fa-exclamation-circle me-2"></i>
                                    {checkinError}
                                </div>
                            )}

                            <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.65rem' }}>
                                Điểm danh có hiệu lực đến {endTime.toLocaleTimeString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </div>

            </aside>
        </div>
    );
};

export default Attendance;