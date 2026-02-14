import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './configure.attendance.module.scss';
import activityService from 'services/activity.service';
import { ActivityDetailResponse } from '@/types/activity.types';
import checkinSessionService from 'services/checkin-session.service';
import type { CreateCheckinSession } from '@/types/checkin-session.types';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [10.8231, 106.6297];
const DEFAULT_RADIUS = 150;

interface MapClickHandlerProps {
    onSelect: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onSelect }) => {
    useMapEvents({
        click: (event) => {
            onSelect(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
};

interface MapViewUpdaterProps {
    center: [number, number];
}

const MapViewUpdater: React.FC<MapViewUpdaterProps> = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center);
    }, [center, map]);

    return null;
};

const parseTimeToMinutes = (value: string): number | null => {
    if (!value) return null;
    const [hourStr, minuteStr] = value.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if ([hour, minute].some((part) => Number.isNaN(part))) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
};

const toLocalTimeValue = (value?: string): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDuration = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
        return `${hours} giờ ${minutes} phút`;
    }
    if (hours > 0) {
        return `${hours} giờ`;
    }
    return `${minutes} phút`;
};

const ConfigureAttendance: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [activityName, setActivityName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [radius, setRadius] = useState(DEFAULT_RADIUS);
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [requirePhoto, setRequirePhoto] = useState(false);
    const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
    const [activityLocationAddress, setActivityLocationAddress] = useState('');
    const [activityDateBase, setActivityDateBase] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const activityId = searchParams.get('activityId') || searchParams.get('id');
    const hasCustomCenterRef = useRef(false);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!activityId) {
                setError('Thiếu activityId trong query');
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await activityService.getDetail(activityId);
                const activityData: ActivityDetailResponse = response.data.data;
                setActivityName(activityData.title || '');
                setActivityLocationAddress(activityData.location?.address || '');
                setActivityDateBase(activityData.startAt);
                if (!hasCustomCenterRef.current && activityData.location?.latitude && activityData.location?.longitude) {
                    setCenter([activityData.location.latitude, activityData.location.longitude]);
                }
                setStartAt(toLocalTimeValue(activityData.startAt));
                setEndAt(toLocalTimeValue(activityData.endAt));
            } catch (err: any) {
                setError(err.message || 'Không thể tải thông tin hoạt động');
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [activityId]);

    const primaryBlue = useMemo(() => {
        if (typeof window === 'undefined') return '#2563eb';
        return (
            getComputedStyle(document.documentElement)
                .getPropertyValue('--color-primary-blue')
                .trim() || '#2563eb'
        );
    }, []);

    const durationLabel = useMemo(() => {
        if (!startAt || !endAt) return 'Chưa đặt giờ';
        const startMinutes = parseTimeToMinutes(startAt);
        const endMinutes = parseTimeToMinutes(endAt);
        if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
            return 'Giờ chưa hợp lệ';
        }
        return `${startAt} - ${endAt}`;
    }, [startAt, endAt]);

    const durationValue = useMemo(() => {
        if (!startAt || !endAt) return '';
        const startMinutes = parseTimeToMinutes(startAt);
        const endMinutes = parseTimeToMinutes(endAt);
        if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
            return '';
        }
        return formatDuration(endMinutes - startMinutes);
    }, [startAt, endAt]);

    const durationWarning = useMemo(() => {
        if (!startAt || !endAt) return '';
        const startMinutes = parseTimeToMinutes(startAt);
        const endMinutes = parseTimeToMinutes(endAt);
        if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
            return '';
        }

        const diffMinutes = endMinutes - startMinutes;
        if (diffMinutes < 20) {
            return 'Giờ kết thúc cần sau bắt đầu tối thiểu 20 phút';
        }
        return '';
    }, [startAt, endAt]);

    const coordinatesLabel = `${center[0].toFixed(5)}, ${center[1].toFixed(5)}`;

    const buildDateTime = (dateBase: string, timeValue: string): Date | null => {
        if (!dateBase || !timeValue) return null;
        const [hourStr, minuteStr] = timeValue.split(':');
        const hour = Number(hourStr);
        const minute = Number(minuteStr);
        if ([hour, minute].some((part) => Number.isNaN(part))) return null;
        const base = new Date(dateBase);
        if (Number.isNaN(base.getTime())) return null;
        base.setHours(hour, minute, 0, 0);
        return base;
    };

    const handleCreateCheckinSession = async () => {
        if (!activityId) {
            setError('Thiếu activityId trong query');
            return;
        }

        const startTime = buildDateTime(activityDateBase, startAt);
        const endTime = buildDateTime(activityDateBase, endAt);

        if (!startTime || !endTime || startTime >= endTime) {
            setError('Giờ bắt đầu và kết thúc chưa hợp lệ');
            return;
        }

        const payload: CreateCheckinSession = {
            activityId,
            location: {
                address: activityLocationAddress || 'N/A',
                latitude: center[0],
                longitude: center[1],
            },
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            radiusMetters: radius,
        };

        try {
            setSubmitting(true);
            setError(null);
            await checkinSessionService.create(payload);
            alert('Tạo buổi điểm danh thành công');
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Không thể tạo buổi điểm danh');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <header className={styles.header}>
                <h2>Cấu hình buổi điểm danh</h2>
                <h3>
                    {activityName || 'Chưa nhập tên hoạt động'}
                    <span className={styles.badge}>Hoạt động đang chọn</span>
                </h3>
                <p>Thiết lập khu vực GPS và lịch điểm danh cho buổi học.</p>
                {loading && <p className="text-muted small">Đang tải thông tin hoạt động...</p>}
                {error && <p className="text-danger small">{error}</p>}
            </header>

            <div className={styles.mainGrid}>
                {/* Cột trái: Cấu hình chính */}
                <div className={styles.leftColumn}>

                    {/* Card 1: Geofence */}
                    <section className={styles.card}>
                        <div className={styles.cardTitle}>
                            <h5><i className="fa-solid fa-location-dot"></i> Cấu hình vùng điểm danh</h5>
                        </div>

                        <div className={styles.mapMockup}>
                            <MapContainer center={center} zoom={15} scrollWheelZoom className={styles.mapContainer}>
                                <TileLayer
                                    attribution="&copy; OpenStreetMap contributors"
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={center} />
                                <Circle center={center} radius={radius} pathOptions={{ color: primaryBlue, fillColor: primaryBlue, fillOpacity: 0.2 }} />
                                <MapViewUpdater center={center} />
                                <MapClickHandler
                                    onSelect={(lat, lng) => {
                                        hasCustomCenterRef.current = true;
                                        setCenter([lat, lng]);
                                    }}
                                />
                            </MapContainer>
                        </div>

                        <div className={styles.radiusControl}>
                            <div className={styles.sliderGroup}>
                                <label>Bán kính điểm danh <span>{radius} mét</span></label>
                                <input
                                    type="range"
                                    min="10"
                                    max="1000"
                                    value={radius}
                                    onChange={(event) => setRadius(Number(event.target.value))}
                                />
                                <div className={styles.rangeLabels}>
                                    <span>10M</span>
                                    <span>500M</span>
                                    <span>1KM</span>
                                </div>
                            </div>
                            <div className={styles.manualInput}>
                                <label>Nhập tay (m)</label>
                                <input
                                    type="number"
                                    value={radius}
                                    min={10}
                                    max={1000}
                                    onChange={(event) => setRadius(Number(event.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Card 2: Timing */}
                    <section className={styles.card}>
                        <div className={styles.cardTitle}>
                            <h5><i className="fa-regular fa-clock"></i> Thời gian điểm danh</h5>
                        </div>
                        <div className={styles.timingGrid}>
                            <div>
                                <label>Giờ bắt đầu</label>
                                <input type="time" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
                            </div>
                            <div>
                                <label>Giờ kết thúc</label>
                                <input type="time" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Cột phải: Tổng quan & Action */}
                <aside className={styles.summarySidebar}>
                    <div className={styles.card}>
                        <h6 className="fw-bold mb-4">Tóm tắt buổi điểm danh</h6>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-solid fa-book"></i></div>
                            <div className={styles.info}>
                                <label>Hoạt động</label>
                                <p>{activityName || 'Chưa nhập tên'}</p>
                            </div>
                        </div>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-solid fa-location-crosshairs"></i></div>
                            <div className={styles.info}>
                                <label>Tọa độ</label>
                                <p>{coordinatesLabel}</p>
                                <small>Chọn vị trí trực tiếp trên bản đồ</small>
                            </div>
                        </div>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-solid fa-bullseye"></i></div>
                            <div className={styles.info}>
                                <label>Bán kính xác nhận</label>
                                <p>{radius} mét</p>
                                <small>GPS radius tùy chỉnh</small>
                            </div>
                        </div>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-regular fa-hourglass-half"></i></div>
                            <div className={styles.info}>
                                <label>Khung giờ</label>
                                <p>{durationLabel}</p>
                                <small>
                                    {durationWarning || (durationValue ? `Tổng thời gian: ${durationValue}` : 'Chưa chọn giờ bắt đầu')}
                                </small>
                            </div>
                        </div>

                        <div className="form-check mb-4 mt-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="photoCheck"
                                checked={requirePhoto}
                                onChange={(event) => setRequirePhoto(event.target.checked)}
                            />
                            <label className="form-check-label small fw-bold text-muted" htmlFor="photoCheck">
                                Yêu cầu ảnh xác minh khi điểm danh
                            </label>
                        </div>

                        <button className={styles.primaryBtn} onClick={handleCreateCheckinSession} disabled={submitting}>
                            <i className="fa-solid fa-circle-check"></i> Tạo buổi điểm danh
                        </button>
                        <button className="btn btn-link w-100 text-muted fw-bold text-decoration-none mt-2 small">Lưu nháp</button>
                    </div>

                    {/* Tip Box */}
                    <div className={styles.tipBox}>
                        <i className="fa-solid fa-circle-info"></i>
                        <div className={styles.tipText}>
                            <label>Gợi ý cho ban tổ chức</label>
                            <p>Với hoạt động trong nhà, nên đặt bán kính tối thiểu 30 mét để bù trừ sai lệch GPS trong các tòa nhà nhiều tầng.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ConfigureAttendance;