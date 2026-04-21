import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from './attendance.module.scss';
import AttendanceMap from './attendance.map';
import checkinSessionService from '../../services/checkin-session.service';
import type { CheckinSession } from '@/types/checkin-session.types';
import { formatTime } from '../../utils/date-time';

type CachedLocation = {
    latitude: number;
    longitude: number;
    capturedAt: number;
};

type CheckinResultModalState = {
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
};

const GEO_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 15000,
};

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
    const [cachedLocation, setCachedLocation] = useState<CachedLocation | null>(null);
    const [checkinResultModal, setCheckinResultModal] = useState<CheckinResultModalState>({
        open: false,
        type: 'success',
        title: '',
        message: '',
    });

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

    useEffect(() => {
        if (!checkinSession?._id || !navigator.geolocation) {
            return;
        }

        // Preload GPS sớm để giảm thời gian chờ khi người dùng bấm điểm danh trên mobile
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCachedLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    capturedAt: Date.now(),
                });
            },
            () => {
                // Bỏ qua lỗi preload, khi điểm danh sẽ thử lấy lại GPS.
            },
            GEO_OPTIONS,
        );
    }, [checkinSession?._id]);

    const handleCheckin = async () => {
        if (!checkinSession?._id) return;

        setIsCheckinLoading(true);
        setCheckinError(null);
        setCheckinSuccess(false);

        try {
            const isCachedLocationFresh = cachedLocation
                ? Date.now() - cachedLocation.capturedAt <= 20000
                : false;
            const freshCachedLocation = isCachedLocationFresh ? cachedLocation : null;

            // Ưu tiên vị trí vừa lấy gần đây để thao tác nhanh hơn trên mobile.
            const position = freshCachedLocation
                ? {
                    latitude: freshCachedLocation.latitude,
                    longitude: freshCachedLocation.longitude,
                }
                : await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                        }),
                        (err) => reject(err),
                        GEO_OPTIONS,
                    );
                });

            // Submit dữ liệu với vị trí
            const response = await checkinSessionService.checkin(
                checkinSession._id,
                position.latitude,
                position.longitude
            );

            setCachedLocation({
                latitude: position.latitude,
                longitude: position.longitude,
                capturedAt: Date.now(),
            });

            const checkinData = response.data.data;

            if (checkinData.status === 'SUCCESS') {
                // Điểm danh thành công
                setCheckinSuccess(true);
                setHasCheckinSuccessfully(true);
                setCheckinResultModal({
                    open: true,
                    type: 'success',
                    title: 'Điểm danh thành công',
                    message: 'Bạn đã điểm danh thành công. Hệ thống sẽ quay lại trang trước sau vài giây.',
                });

                // Quay về trang trước sau 2 giây
                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            } else if (checkinData.status === 'FAILED') {
                // Điểm danh thất bại - hiển thị lý do
                const failReason = checkinData.failReason || 'Không rõ nguyên nhân thất bại';
                setCheckinError(`Điểm danh thất bại: ${failReason}`);
                setCheckinResultModal({
                    open: true,
                    type: 'error',
                    title: 'Điểm danh thất bại',
                    message: failReason,
                });
            } else {
                // Các trạng thái hợp lệ khác (ví dụ LATE) vẫn xem là hoàn tất điểm danh
                setCheckinSuccess(true);
                setHasCheckinSuccessfully(true);
                setCheckinResultModal({
                    open: true,
                    type: 'success',
                    title: 'Điểm danh hoàn tất',
                    message: 'Bạn đã điểm danh thành công.',
                });

                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            }
        } catch (err) {
            if (err instanceof GeolocationPositionError) {
                setCheckinError('Không thể lấy vị trí. Vui lòng kiểm tra quyền GPS!');
                setCheckinResultModal({
                    open: true,
                    type: 'error',
                    title: 'Không thể điểm danh',
                    message: 'Không thể lấy vị trí. Vui lòng kiểm tra quyền GPS!',
                });
            } else {
                // Bắt error message từ backend
                const errorMessage = (err as any)?.response?.data?.message
                    || (err as any)?.message
                    || 'Lỗi khi điểm danh. Vui lòng thử lại!';
                setCheckinError(errorMessage);
                setCheckinResultModal({
                    open: true,
                    type: 'error',
                    title: 'Không thể điểm danh',
                    message: errorMessage,
                });
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
                                    <span className="fw-bold small">{formatTime(startTime)}</span>
                                </div>
                                <div>
                                    <small className="text-muted d-block">THỜI GIAN KẾT THÚC</small>
                                    <span className="fw-bold small">{formatTime(endTime)}</span>
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

                            <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.65rem' }}>
                                Điểm danh có hiệu lực đến {formatTime(endTime)}
                            </p>
                        </div>
                    </div>
                </div>

            </aside>

            <Modal
                show={checkinResultModal.open}
                onHide={() => setCheckinResultModal((prev) => ({ ...prev, open: false }))}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{checkinResultModal.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div
                        className={`alert ${checkinResultModal.type === 'success' ? 'alert-success' : 'alert-danger'} mb-0`}
                        role="alert"
                    >
                        <i
                            className={`fa-solid ${checkinResultModal.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} me-2`}
                        ></i>
                        {checkinResultModal.message}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Attendance;