import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import styles from './acctivity.participants.module.scss';
import activityService from '../../services/activity.service';
import { ParticipantItem, ParticipantStatus } from '@/types/participan.types';
import checkinSessionService from '../../services/checkin-session.service';
import checkinService from '../../services/checkin.service';
import { CheckinResponse } from '../../types/checkin.types';
import {
    buildSafeFileName,
    exportRowsToCsv,
    exportRowsToXlsx,
    type ExportRow,
} from '../../utils/export-report';


const ActivityParticipants: React.FC = () => {
    const { activityId: routeActivityId } = useParams<{ activityId?: string }>();
    const [searchParams] = useSearchParams();
    const activityId = searchParams.get('activityId') || routeActivityId || '';

    const [participants, setParticipants] = useState<ParticipantItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
    const [exportingFormat, setExportingFormat] = useState<'csv' | 'xlsx' | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [exportMessage, setExportMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchParticipants = async () => {
            if (!activityId) {
                setParticipants([]);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await activityService.participantsByActivity(activityId);
                const data = response.data?.data || [];
                setParticipants(Array.isArray(data) ? data : []);
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Không thể tải danh sách tham gia');
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, [activityId]);

    const filteredParticipants = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return participants.filter((participant) => {
            const name = participant.studentName?.toLowerCase() || '';
            const code = participant.studentCode?.toLowerCase() || '';
            const className = participant.className || '';
            const status = participant.status || 'UNKNOWN';

            const matchesSearch = !keyword || name.includes(keyword) || code.includes(keyword);
            const matchesClass = selectedClassFilter === 'ALL' || className === selectedClassFilter;
            const matchesStatus = selectedStatusFilter === 'ALL' || status === selectedStatusFilter;

            return matchesSearch && matchesClass && matchesStatus;
        });
    }, [participants, searchTerm, selectedClassFilter, selectedStatusFilter]);

    const classFilterOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                participants
                    .map((participant) => participant.className?.trim())
                    .filter((value): value is string => Boolean(value)),
            ),
        );

        return values.sort((a, b) => a.localeCompare(b, 'vi'));
    }, [participants]);

    const statusFilterOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                participants
                    .map((participant) => participant.status)
                    .filter((value): value is string => Boolean(value)),
            ),
        );

        return values;
    }, [participants]);

    const totalRegistered = participants.length;
    const confirmedCount = participants.filter((p) => p.status === 'APPROVED').length;
    const pendingCount = participants.filter((p) => p.status === 'PENDING').length;

    const normalizeUserId = (value: unknown): string => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value !== null && '_id' in value) {
            return String((value as { _id?: unknown })._id ?? '');
        }
        return String(value);
    };

    const getInitials = (name?: string) => {
        if (!name) return 'NA';
        const parts = name.trim().split(' ');
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return `${first}${last}`.toUpperCase() || 'NA';
    };

    const mapStatus = (status?: ParticipantStatus) => {
        switch (status) {
            case 'APPROVED':
                return { label: 'Đã duyệt', className: 'confirmed' };
            case 'PENDING':
                return { label: 'Chờ duyệt', className: 'pending' };
            case 'REJECTED':
                return { label: 'Từ chối', className: 'pending' };
            case 'CANCELLED':
                return { label: 'Đã hủy', className: 'pending' };
            default:
                return { label: status || 'Không rõ', className: 'pending' };
        }
    };

    const formatDateTime = (value?: string, fallback: string = 'Chưa cập nhật') => {
        if (!value) {
            return fallback;
        }

        const safeDate = new Date(value);
        if (Number.isNaN(safeDate.getTime())) {
            return fallback;
        }

        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(safeDate);
    };

    const getRegistrationStatusLabel = (status?: ParticipantStatus) => {
        switch (status) {
            case 'APPROVED':
                return 'Đã duyệt';
            case 'PENDING':
                return 'Chờ duyệt';
            case 'REJECTED':
                return 'Từ chối';
            case 'CANCELLED':
                return 'Đã hủy';
            default:
                return status || 'Không rõ';
        }
    };

    const buildAttendanceSummaryByUser = useCallback(async () => {
        const summaryMap = new Map<
            string,
            {
                hasCheckedIn: boolean;
                validCheckinCount: number;
                firstCheckinAt?: string;
                lastCheckinAt?: string;
            }
        >();

        const sessionsResponse = await checkinSessionService.listByActivityId(activityId);
        const sessionsPayload = sessionsResponse.data?.data ?? sessionsResponse.data;
        const sessions = Array.isArray(sessionsPayload) ? sessionsPayload : [];

        if (!sessions.length) {
            return summaryMap;
        }

        const checkinResponses = await Promise.allSettled(
            sessions.map((session: any) => {
                const sessionId = String(session?._id || session?.id || '');
                if (!sessionId) {
                    return Promise.resolve({ total: 0, data: [] as CheckinResponse[] });
                }

                return checkinService.getCheckinsBySessionId(sessionId);
            }),
        );

        const validStatuses = new Set(['SUCCESS', 'LATE']);

        checkinResponses.forEach((result) => {
            if (result.status !== 'fulfilled') {
                return;
            }

            const checkins = Array.isArray(result.value?.data) ? result.value.data : [];

            checkins.forEach((checkin) => {
                if (!validStatuses.has(checkin.status)) {
                    return;
                }

                const userId = normalizeUserId(checkin.userId);
                if (!userId) {
                    return;
                }

                const existing = summaryMap.get(userId) || {
                    hasCheckedIn: false,
                    validCheckinCount: 0,
                    firstCheckinAt: undefined,
                    lastCheckinAt: undefined,
                };

                const checkinTimeMs = new Date(checkin.createdAt).getTime();
                const hasValidTime = !Number.isNaN(checkinTimeMs);

                existing.hasCheckedIn = true;
                existing.validCheckinCount += 1;

                if (hasValidTime) {
                    const firstTimeMs = existing.firstCheckinAt
                        ? new Date(existing.firstCheckinAt).getTime()
                        : Number.POSITIVE_INFINITY;
                    const lastTimeMs = existing.lastCheckinAt
                        ? new Date(existing.lastCheckinAt).getTime()
                        : Number.NEGATIVE_INFINITY;

                    if (checkinTimeMs < firstTimeMs) {
                        existing.firstCheckinAt = checkin.createdAt;
                    }

                    if (checkinTimeMs > lastTimeMs) {
                        existing.lastCheckinAt = checkin.createdAt;
                    }
                }

                summaryMap.set(userId, existing);
            });
        });

        return summaryMap;
    }, [activityId]);

    const buildExportRows = useCallback(async (): Promise<ExportRow[]> => {
        const attendanceSummaryByUser = await buildAttendanceSummaryByUser();

        return filteredParticipants.map((participant, index) => {
            const userId = normalizeUserId(participant.userId);
            const attendanceSummary = userId ? attendanceSummaryByUser.get(userId) : undefined;

            return {
                STT: index + 1,
                MSSV: participant.studentCode || 'N/A',
                'Họ và tên': participant.studentName || 'N/A',
                Lớp: participant.className || 'N/A',
                Khoa: participant.facultyName || 'N/A',
                'Trạng thái đăng ký': getRegistrationStatusLabel(participant.status),
                'Trạng thái điểm danh': attendanceSummary?.hasCheckedIn ? 'Đã điểm danh' : 'Chưa điểm danh',
                'Số lần điểm danh hợp lệ': attendanceSummary?.validCheckinCount || 0,
                'Checkin đầu tiên': formatDateTime(attendanceSummary?.firstCheckinAt, 'Chưa điểm danh'),
                'Checkin gần nhất': formatDateTime(attendanceSummary?.lastCheckinAt, 'Chưa điểm danh'),
                'Thời gian đăng ký': formatDateTime(participant.registeredAt),
            };
        });
    }, [buildAttendanceSummaryByUser, filteredParticipants]);

    const handleExport = useCallback(
        async (format: 'csv' | 'xlsx') => {
            if (!activityId) {
                setExportError('Thiếu activityId, không thể xuất báo cáo.');
                setExportMessage(null);
                return;
            }

            if (filteredParticipants.length === 0) {
                setExportError('Không có dữ liệu phù hợp để xuất báo cáo.');
                setExportMessage(null);
                return;
            }

            try {
                setExportingFormat(format);
                setExportError(null);
                setExportMessage(null);

                const exportRows = await buildExportRows();
                const baseName = buildSafeFileName(`participants-report-${activityId.slice(-6)}`);

                if (format === 'csv') {
                    exportRowsToCsv(exportRows, `${baseName}.csv`);
                    setExportMessage('Xuất CSV thành công.');
                    return;
                }

                exportRowsToXlsx(exportRows, `${baseName}.xlsx`, 'Danh sach');
                setExportMessage('Xuất Excel thành công.');
            } catch (err: any) {
                setExportError(err?.message || 'Không thể xuất báo cáo lúc này.');
            } finally {
                setExportingFormat(null);
            }
        },
        [activityId, buildExportRows, filteredParticipants.length],
    );

    return (
        <div className={styles.managementWrapper}>
            {/* 1. Header */}
            <header className={styles.header}>
                <div>
                    <h2>Danh sách tham gia hoạt động</h2>
                    <p>{activityId ? `Mã hoạt động: ${activityId}` : 'Vui lòng cung cấp activityId'}</p>
                </div>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.btnOutline}
                        type="button"
                        onClick={() => handleExport('csv')}
                        disabled={loading || exportingFormat !== null}
                    >
                        <i className="fa-solid fa-file-csv"></i>
                        {exportingFormat === 'csv' ? 'Đang xuất CSV...' : 'Xuất CSV'}
                    </button>
                    <button
                        className={styles.btnOutline}
                        type="button"
                        onClick={() => handleExport('xlsx')}
                        disabled={loading || exportingFormat !== null}
                    >
                        <i className="fa-solid fa-file-excel"></i>
                        {exportingFormat === 'xlsx' ? 'Đang xuất Excel...' : 'Xuất Excel'}
                    </button>
                    <button className={styles.btnPrimary}><i className="fa-solid fa-bolt"></i> Thao tác hàng loạt</button>
                </div>
            </header>

            {exportError && <p className={styles.exportError}>{exportError}</p>}
            {exportMessage && <p className={styles.exportSuccess}>{exportMessage}</p>}

            {/* 2. Thống kê nhanh */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <label>Tổng đã đăng ký</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{totalRegistered}</span>
                        <span className={`${styles.trend} ${styles.up}`}><i className="fa-solid fa-arrow-trend-up"></i> +0%</span>
                    </div>
                    <div className={styles.iconBadge} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}><i className="fa-solid fa-users"></i></div>
                </div>

                <div className={styles.statCard}>
                    <label>Đã duyệt</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{confirmedCount}</span>
                        <span className={`${styles.trend} ${styles.up}`}><i className="fa-solid fa-arrow-trend-up"></i> +0%</span>
                    </div>
                    <div className={styles.iconBadge} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}><i className="fa-solid fa-check"></i></div>
                </div>

                <div className={styles.statCard}>
                    <label>Chờ duyệt</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{pendingCount}</span>
                        <span className={`${styles.trend} ${styles.down}`}><i className="fa-solid fa-arrow-trend-down"></i> 0%</span>
                    </div>
                    <div className={styles.iconBadge} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}><i className="fa-solid fa-ellipsis"></i></div>
                </div>
            </div>

            {/* 3. Bảng dữ liệu */}
            <div className={styles.tableContainer}>
                <div className={styles.tableFilters}>
                    <div className={styles.leftFilters}>
                        <div className={styles.searchBox}>
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                type="text"
                                placeholder="Tìm theo tên sinh viên hoặc MSSV..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className={styles.selectBox}
                            value={selectedClassFilter}
                            onChange={(e) => setSelectedClassFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả lớp</option>
                            {classFilterOptions.map((className) => (
                                <option value={className} key={className}>
                                    {className}
                                </option>
                            ))}
                        </select>
                        <select
                            className={styles.selectBox}
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            {statusFilterOptions.map((status) => (
                                <option value={status} key={status}>
                                    {getRegistrationStatusLabel(status)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex gap-3">
                        <button className="btn btn-light border"><i className="fa-solid fa-sliders"></i></button>
                        <button className="btn btn-light border"><i className="fa-solid fa-rotate"></i></button>
                    </div>
                </div>

                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}><input type="checkbox" /></th>
                            <th>Mã SV</th>
                            <th>Họ và tên</th>
                            <th>Lớp</th>
                            <th>Khoa</th>
                            <th>Thời gian đăng ký</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={8} className="text-center text-muted py-4">Đang tải dữ liệu...</td>
                            </tr>
                        )}

                        {!loading && error && (
                            <tr>
                                <td colSpan={8} className="text-center text-danger py-4">{error}</td>
                            </tr>
                        )}

                        {!loading && !error && filteredParticipants.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center text-muted py-4">Không có dữ liệu</td>
                            </tr>
                        )}

                        {!loading && !error && filteredParticipants.map((stu, index) => {
                            const statusInfo = mapStatus(stu.status);
                            const initials = getInitials(stu.studentName);
                            return (
                                <tr key={stu._id || index}>
                                    <td><input type="checkbox" /></td>
                                    <td className="fw-bold">{stu.studentCode || 'Chưa cập nhật'}</td>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            <div className={styles.avatar} style={{ backgroundColor: `hsla(${index * 50}, 70%, 90%, 1)`, color: `hsla(${index * 50}, 70%, 40%, 1)` }}>
                                                {initials}
                                            </div>
                                            {stu.studentName || 'Chưa cập nhật'}
                                        </div>
                                    </td>
                                    <td>{stu.className || 'Chưa cập nhật'}</td>
                                    <td>{stu.facultyName || 'Chưa cập nhật'}</td>
                                    <td>{formatDateTime(stu.registeredAt)}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td><i className="fa-solid fa-ellipsis-vertical text-muted cursor-pointer"></i></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* 4. Phân trang */}
                <div className={styles.pagination}>
                    <span>Hiển thị <b>{filteredParticipants.length}</b> / <b>{participants.length}</b> sinh viên</span>
                    <div className={styles.pageNumbers}>
                        <button><i className="fa-solid fa-chevron-left"></i></button>
                        <button className={styles.active}>1</button>
                        <button>2</button>
                        <button>3</button>
                        <span>...</span>
                        <button>126</button>
                        <button><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityParticipants;