import React, { useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './configure.attendance.module.scss';

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

const parseLocalDateTime = (value: string): Date | null => {
    if (!value) return null;
    const [datePart, timePart] = value.split('T');
    if (!datePart || !timePart) return null;
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    const [hourStr, minuteStr] = timePart.split(':');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) return null;
    return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const ConfigureAttendance: React.FC = () => {
    const [activityName] = useState('');
    const [radius, setRadius] = useState(DEFAULT_RADIUS);
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [requirePhoto, setRequirePhoto] = useState(false);
    const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

    const primaryBlue = useMemo(() => {
        if (typeof window === 'undefined') return '#2563eb';
        return (
            getComputedStyle(document.documentElement)
                .getPropertyValue('--color-primary-blue')
                .trim() || '#2563eb'
        );
    }, []);

    const durationLabel = useMemo(() => {
        if (!startAt || !endAt) return 'Chưa đặt lịch';
        const start = parseLocalDateTime(startAt);
        const end = parseLocalDateTime(endAt);
        if (!start || !end || end <= start) {
            return 'Thời gian chưa hợp lệ';
        }

        const diffMs = end.getTime() - start.getTime();
        const minutes = Math.round(diffMs / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0 && remainingMinutes > 0) {
            return `${hours} giờ ${remainingMinutes} phút`;
        }
        if (hours > 0) {
            return `${hours} giờ`;
        }
        return `${minutes} phút`;
    }, [startAt, endAt]);

    const durationWarning = useMemo(() => {
        if (!startAt || !endAt) return '';
        const start = parseLocalDateTime(startAt);
        const end = parseLocalDateTime(endAt);
        if (!start || !end || end <= start) {
            return '';
        }

        const diffMs = end.getTime() - start.getTime();
        if (diffMs < 20 * 60 * 1000) {
            return 'Thời gian kết thúc cần sau bắt đầu tối thiểu 20 phút';
        }
        return '';
    }, [startAt, endAt]);

    const coordinatesLabel = `${center[0].toFixed(5)}, ${center[1].toFixed(5)}`;

    return (
        <div className={styles.pageContainer}>
            {/* Breadcrumbs */}
            <nav className={styles.breadcrumbs}>
                Dashboard / Activities / {activityName || 'Chưa chọn hoạt động'} / <span>Configure Session</span>
            </nav>

            {/* Header */}
            <header className={styles.header}>
                <h2>Configure Attendance Session</h2>
                <h3>
                    {activityName || 'Chưa nhập tên hoạt động'}
                    <span className={styles.badge}>Active Activity</span>
                </h3>
                <p>Thiết lập khu vực GPS và lịch điểm danh cho buổi học.</p>
            </header>

            <div className={styles.mainGrid}>
                {/* Cột trái: Cấu hình chính */}
                <div className={styles.leftColumn}>

                    {/* Card 1: Geofence */}
                    <section className={styles.card}>
                        <div className={styles.cardTitle}>
                            <h5><i className="fa-solid fa-location-dot"></i> Geofence Configuration</h5>
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
                                        setCenter([lat, lng]);
                                    }}
                                />
                            </MapContainer>
                        </div>

                        <div className={styles.radiusControl}>
                            <div className={styles.sliderGroup}>
                                <label>Attendance Radius <span>{radius} meters</span></label>
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
                                <label>Manual Input (m)</label>
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
                            <h5><i className="fa-regular fa-clock"></i> Timing & Schedule</h5>
                        </div>
                        <div className={styles.timingGrid}>
                            <div>
                                <label>Start Date & Time</label>
                                <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
                            </div>
                            <div>
                                <label>End Date & Time</label>
                                <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Cột phải: Tổng quan & Action */}
                <aside className={styles.summarySidebar}>
                    <div className={styles.card}>
                        <h6 className="fw-bold mb-4">Session Summary</h6>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-solid fa-book"></i></div>
                            <div className={styles.info}>
                                <label>Activity</label>
                                <p>{activityName || 'Chưa nhập tên'}</p>
                            </div>
                        </div>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-solid fa-location-crosshairs"></i></div>
                            <div className={styles.info}>
                                <label>Coordinates</label>
                                <p>{coordinatesLabel}</p>
                                <small>Chọn vị trí trực tiếp trên bản đồ</small>
                            </div>
                        </div>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-solid fa-bullseye"></i></div>
                            <div className={styles.info}>
                                <label>Validation Radius</label>
                                <p>{radius} Meters</p>
                                <small>GPS radius tùy chỉnh</small>
                            </div>
                        </div>

                        <div className={styles.summaryItem}>
                            <div className={styles.iconBox}><i className="fa-regular fa-hourglass-half"></i></div>
                            <div className={styles.info}>
                                <label>Duration</label>
                                <p>{durationLabel}</p>
                                <small>
                                    {durationWarning || (startAt ? new Date(startAt).toLocaleString() : 'Chưa chọn thời gian bắt đầu')}
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
                                Require photo proof on check-in
                            </label>
                        </div>

                        <button className={styles.primaryBtn}>
                            <i className="fa-solid fa-circle-check"></i> Create Session
                        </button>
                        <button className="btn btn-link w-100 text-muted fw-bold text-decoration-none mt-2 small">Save as Draft</button>
                    </div>

                    {/* Tip Box */}
                    <div className={styles.tipBox}>
                        <i className="fa-solid fa-circle-info"></i>
                        <div className={styles.tipText}>
                            <label>Organizer Tip</label>
                            <p>For indoor activities, we recommend a minimum radius of 30 meters to account for GPS signal drift in multi-story buildings.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ConfigureAttendance;