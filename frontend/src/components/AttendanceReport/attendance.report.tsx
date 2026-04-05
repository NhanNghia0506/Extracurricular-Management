import React from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L, { LatLngExpression, LatLngTuple } from 'leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';
import styles from './AttendanceReport.module.scss';
import checkinService from '../../services/checkin.service';
import checkinSessionService from '../../services/checkin-session.service';
import activityService from '../../services/activity.service';
import type { CheckinResponse } from '../../types/checkin.types';
import type { CheckinSession } from '../../types/checkin-session.types';
import type { ActivityDetailResponse } from '../../types/activity.types';

type MethodLabel = 'GPS' | 'Thủ công';

type AttendanceReportRow = CheckinResponse & {
    method: MethodLabel;
    deviceId?: string;
};

const PAGE_SIZE = 10;

const defaultCenter: LatLngTuple = [10.7769, 106.7009];

const personMarkerIcon = (isSelected: boolean) => L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
        <div style="width:28px;height:28px;border-radius:999px;background:${isSelected ? '#2563eb' : '#0f766e'};border:3px solid #fff;box-shadow:0 8px 20px rgba(15,23,42,0.2);"></div>
    `,
});

const formatDateTime = (value?: string | Date) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
};

const formatDate = (value?: string | Date) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('vi-VN');
};

const AttendanceReport: React.FC = () => {
    const location = useLocation();
    const queryParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
    const sessionId = queryParams.get('sessionId') || queryParams.get('checkinSessionId') || '';
    const activityId = queryParams.get('activityId') || '';

    const [session, setSession] = React.useState<CheckinSession | null>(null);
    const [activity, setActivity] = React.useState<ActivityDetailResponse | null>(null);
    const [rows, setRows] = React.useState<AttendanceReportRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'SUCCESS' | 'LATE' | 'FAILED'>('ALL');
    const [methodFilter, setMethodFilter] = React.useState<'ALL' | MethodLabel>('ALL');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedRowId, setSelectedRowId] = React.useState<string>('');

    React.useEffect(() => {
        const loadReport = async () => {
            try {
                setLoading(true);
                setError(null);

                let nextSession: CheckinSession | null = null;
                if (sessionId) {
                    const sessionResponse = await checkinSessionService.getById(sessionId);
                    nextSession = sessionResponse.data?.data ?? null;
                } else if (activityId) {
                    const sessionResponse = await checkinSessionService.getByActivityId(activityId);
                    nextSession = sessionResponse.data?.data ?? null;
                }

                if (!nextSession) {
                    throw new Error('Không tìm thấy check-in session. Hãy mở trang này từ hoạt động có phiên điểm danh.');
                }

                setSession(nextSession);

                const resolvedActivityId = typeof nextSession.activityId === 'string'
                    ? nextSession.activityId
                    : (nextSession.activityId as unknown as { _id?: string; id?: string })?._id
                    || (nextSession.activityId as unknown as { _id?: string; id?: string })?.id
                    || '';

                if (resolvedActivityId) {
                    const activityResponse = await activityService.getDetail(resolvedActivityId);
                    setActivity(activityResponse.data?.data ?? null);
                }

                const checkinsResponse = await checkinService.getCheckinsBySessionId(nextSession._id);
                const checkinItems = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];

                setRows(checkinItems.map((item) => ({
                    ...item,
                    method: (item as CheckinResponse & { deviceId?: string }).deviceId?.startsWith('manual:') ? 'Thủ công' : 'GPS',
                    deviceId: (item as CheckinResponse & { deviceId?: string }).deviceId,
                })));
            } catch (reportError) {
                const message = reportError instanceof Error ? reportError.message : 'Không thể tải báo cáo điểm danh';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        void loadReport();
    }, [activityId, sessionId]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, methodFilter]);

    const filteredRows = React.useMemo(() => {
        return rows.filter((row) => {
            const statusMatch = statusFilter === 'ALL' || row.status === statusFilter;
            const methodMatch = methodFilter === 'ALL' || row.method === methodFilter;
            return statusMatch && methodMatch;
        });
    }, [methodFilter, rows, statusFilter]);

    React.useEffect(() => {
        if (!selectedRowId && filteredRows[0]?._id) {
            setSelectedRowId(filteredRows[0]._id);
            return;
        }

        if (selectedRowId && !filteredRows.some((row) => row._id === selectedRowId)) {
            setSelectedRowId(filteredRows[0]?._id || '');
        }
    }, [filteredRows, selectedRowId]);

    const totalAttempts = rows.length;
    const successfulAttempts = rows.filter((row) => row.status === 'SUCCESS' || row.status === 'LATE').length;
    const failedAttempts = rows.filter((row) => row.status === 'FAILED').length;
    const successRate = totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(1) : '0.0';

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const selectedRow = filteredRows.find((row) => row._id === selectedRowId) || pagedRows[0] || filteredRows[0] || null;

    const sessionTitle = session?.title || 'Báo cáo điểm danh';
    const locationLabel = session?.location?.address || activity?.location?.address || 'Chưa có địa điểm';
    const sessionCenter: LatLngTuple = session?.location
        ? [session.location.latitude, session.location.longitude]
        : defaultCenter;
    const selectedLocation: LatLngTuple | null = selectedRow
        ? [selectedRow.latitude, selectedRow.longitude]
        : null;
    const selectedInsideRadius = Boolean(
        selectedRow && session?.radiusMetters !== undefined
        && typeof selectedRow.distance === 'number'
        && selectedRow.distance <= session.radiusMetters,
    );

    const cycleStatusFilter = () => {
        setStatusFilter((current) => {
            if (current === 'ALL') return 'SUCCESS';
            if (current === 'SUCCESS') return 'LATE';
            if (current === 'LATE') return 'FAILED';
            return 'ALL';
        });
    };

    const cycleMethodFilter = () => {
        setMethodFilter((current) => {
            if (current === 'ALL') return 'GPS';
            if (current === 'GPS') return 'Thủ công';
            return 'ALL';
        });
    };

    if (loading) {
        return <div className={styles.loadingState}>Đang tải báo cáo điểm danh...</div>;
    }

    if (error) {
        return <div className={styles.errorState}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.reportHeader}>
                <div>
                    <h1 className={styles.reportTitle}>Báo cáo chi tiết điểm danh</h1>
                    <p className={styles.reportSubtitle}>
                        {sessionTitle} • {locationLabel}
                    </p>
                    <p className={styles.reportSubtitle}>
                        Phiên: {session?._id || '--'} • Ngày tạo: {formatDate(session?.createdAt || session?.updatedAt)}
                    </p>
                </div>
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.card}>
                    <label>Total Attempts</label>
                    <div className={styles.mainValue}>{totalAttempts}</div>
                    <div className={styles.subDetail}>Tổng số lượt check-in của phiên</div>
                </div>
                <div className={styles.card}>
                    <label>Successful</label>
                    <div className={styles.mainValue} style={{ color: '#22c55e' }}>{successfulAttempts}</div>
                    <div className={styles.subDetail}>SUCCESS + LATE</div>
                </div>
                <div className={styles.card}>
                    <label>Failed</label>
                    <div className={styles.mainValue} style={{ color: '#ef4444' }}>{failedAttempts}</div>
                    <div className={styles.subDetail}>Điểm danh thất bại</div>
                </div>
                <div className={`${styles.card} ${styles.highlight}`}>
                    <label>Success Rate</label>
                    <div className={styles.mainValue}>{successRate}%</div>
                    <div className={styles.subDetail}>Tỷ lệ check-in hợp lệ</div>
                </div>
            </div>

            <div className={styles.mapPanel}>
                <div className={styles.mapHeader}>
                    <div>
                        <h3 className={styles.mapTitle}>Vị trí check-in theo người dùng</h3>
                        <p className={styles.mapSubtitle}>
                            Bấm vào một dòng trong bảng để xem vị trí của người đó so với vòng tròn giới hạn.
                        </p>
                    </div>
                    {selectedRow ? (
                        <div className={styles.locationBadge} data-inside={selectedInsideRadius ? 'true' : 'false'}>
                            {selectedInsideRadius ? 'Trong vùng hợp lệ' : 'Ngoài vùng giới hạn'}
                        </div>
                    ) : null}
                </div>

                <div className={styles.mapShell}>
                    <MapContainer center={selectedLocation || sessionCenter} zoom={16} className={styles.mapCanvas}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {session?.location && (
                            <>
                                <Circle
                                    center={sessionCenter as LatLngExpression}
                                    radius={session.radiusMetters || 0}
                                    pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.15, weight: 2 }}
                                />
                                <Marker position={sessionCenter as LatLngExpression}>
                                    <Popup>
                                        <strong>{sessionTitle}</strong>
                                        <div>{locationLabel}</div>
                                        <div>Bán kính: {session.radiusMetters || 0}m</div>
                                    </Popup>
                                </Marker>
                            </>
                        )}

                        {selectedLocation && selectedRow && (
                            <Marker position={selectedLocation as LatLngExpression} icon={personMarkerIcon(selectedRow._id === selectedRowId)}>
                                <Popup>
                                    <strong>{selectedRow.student.name}</strong>
                                    <div>MSSV: {selectedRow.student.mssv}</div>
                                    <div>Trạng thái: {selectedRow.status}</div>
                                    <div>Khoảng cách: {Math.round(selectedRow.distance)}m</div>
                                    <div>{selectedInsideRadius ? 'Trong vùng hợp lệ' : 'Ngoài vùng giới hạn'}</div>
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>

                {selectedRow && (
                    <div className={styles.selectedSummary}>
                        <div>
                            <strong>{selectedRow.student.name}</strong>
                            <span>MSSV: {selectedRow.student.mssv}</span>
                        </div>
                        <div>
                            <span>Vị trí: {selectedRow.latitude.toFixed(6)}, {selectedRow.longitude.toFixed(6)}</span>
                            <span>Khoảng cách: {Math.round(selectedRow.distance)}m</span>
                        </div>
                        <div className={selectedInsideRadius ? styles.insideTag : styles.outsideTag}>
                            {selectedInsideRadius ? 'Nằm trong vòng tròn' : 'Nằm ngoài vòng tròn'}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableActions}>
                    <div className={styles.filters}>
                        <button className={styles.filterBtn} onClick={cycleStatusFilter}>Trạng thái: {statusFilter}</button>
                        <button className={styles.filterBtn} onClick={cycleMethodFilter}>Phương thức: {methodFilter}</button>
                    </div>
                    <button className={styles.exportBtn} onClick={() => window.alert('Chức năng xuất file sẽ được bổ sung sau.')}>
                        <FontAwesomeIcon icon={faDownload} /> Xuất file báo cáo
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Student Info</th>
                            <th>Session Info</th>
                            <th>Timestamp</th>
                            <th>Status</th>
                            <th>Method</th>
                            <th>Reason for Failure</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>Không có dữ liệu theo bộ lọc hiện tại.</td>
                            </tr>
                        ) : pagedRows.map((row) => (
                            <tr
                                key={row._id}
                                className={`${styles.clickableRow} ${selectedRowId === row._id ? styles.activeRow : ''}`}
                                onClick={() => setSelectedRowId(row._id)}
                            >
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                                        <div className={styles.mainCell}>
                                            <strong>{row.student.name}</strong>
                                            <small className={styles.mutedText}>MSSV: {row.student.mssv}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <strong>{sessionTitle}</strong>
                                    <div className={styles.mutedText}>Khu vực: {locationLabel}</div>
                                </td>
                                <td>
                                    <strong style={{ color: row.status === 'FAILED' ? '#ef4444' : 'inherit' }}>{formatDateTime(row.createdAt)}</strong>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${row.status === 'FAILED' ? styles.failed : styles.success}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ fontSize: '13px', color: '#0061ff', fontWeight: 600 }}>{row.method}</span>
                                </td>
                                <td style={{ color: row.status === 'FAILED' ? '#ef4444' : '#64748b', fontSize: '13px' }}>
                                    {row.failReason || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className={styles.pagination}>
                    <span style={{ marginRight: 'auto', fontSize: '13px', color: '#64748b' }}>
                        Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} trên {filteredRows.length} kết quả
                    </span>
                    <button className={styles.pageItem} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>‹</button>
                    <div className={`${styles.pageItem} ${styles.active}`}>{currentPage}</div>
                    <button className={styles.pageItem} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages}>›</button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReport;