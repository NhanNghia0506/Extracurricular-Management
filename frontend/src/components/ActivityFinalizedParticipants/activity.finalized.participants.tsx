import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import styles from './activity.finalized.participants.module.scss';
import activityService from '../../services/activity.service';
import { ParticipantItem } from '@/types/participan.types';
import type { ActivityDetailResponse } from '@/types/activity.types';
import {
    buildSafeFileName,
    exportRowsToCsv,
    exportRowsToXlsx,
    type ExportRow,
} from '../../utils/export-report';

const ActivityFinalizedParticipants: React.FC = () => {
    const { activityId: routeActivityId } = useParams<{ activityId?: string }>();
    const [searchParams] = useSearchParams();
    const activityId = searchParams.get('activityId') || routeActivityId || '';

    const [allParticipants, setAllParticipants] = useState<ParticipantItem[]>([]);
    const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
    const [exportingFormat, setExportingFormat] = useState<'csv' | 'xlsx' | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [exportMessage, setExportMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 10;

    useEffect(() => {
        const fetchData = async () => {
            if (!activityId) {
                setAllParticipants([]);
                setActivity(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch activity detail
                const activityResponse = await activityService.getDetail(activityId);
                const activityData = activityResponse.data?.data as ActivityDetailResponse | undefined;
                setActivity(activityData || null);

                // Fetch all participants
                const participantsResponse = await activityService.participantsByActivity(activityId);
                const data = participantsResponse.data?.data || [];
                setAllParticipants(Array.isArray(data) ? data : []);
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activityId]);

    // Filter only PARTICIPATED status
    const finalizedParticipants = useMemo(() => {
        return allParticipants.filter((p) => p.status === 'PARTICIPATED');
    }, [allParticipants]);

    const filteredParticipants = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return finalizedParticipants.filter((participant) => {
            const name = participant.studentName?.toLowerCase() || '';
            const code = participant.studentCode?.toLowerCase() || '';
            const className = participant.className || '';

            const matchesSearch = !keyword || name.includes(keyword) || code.includes(keyword);
            const matchesClass = selectedClassFilter === 'ALL' || className === selectedClassFilter;

            return matchesSearch && matchesClass;
        });
    }, [finalizedParticipants, searchTerm, selectedClassFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedClassFilter, finalizedParticipants.length]);

    const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / pageSize));
    const shouldPaginate = filteredParticipants.length > pageSize;

    const paginatedParticipants = useMemo(() => {
        if (!shouldPaginate) {
            return filteredParticipants;
        }

        const start = (currentPage - 1) * pageSize;
        return filteredParticipants.slice(start, start + pageSize);
    }, [filteredParticipants, currentPage, shouldPaginate]);

    const classFilterOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                finalizedParticipants
                    .map((participant) => participant.className?.trim())
                    .filter((value): value is string => Boolean(value)),
            ),
        );

        return values.sort((a, b) => a.localeCompare(b, 'vi'));
    }, [finalizedParticipants]);

    const totalRegistered = allParticipants.length;
    const participatedCount = finalizedParticipants.length;
    const participationRate = totalRegistered > 0 ? Math.round((participatedCount / totalRegistered) * 100) : 0;

    const getInitials = (name?: string) => {
        if (!name) return 'NA';
        const parts = name.trim().split(' ');
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return `${first}${last}`.toUpperCase() || 'NA';
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

    const handleExport = async (format: 'csv' | 'xlsx') => {
        try {
            setExportingFormat(format);
            setExportError(null);
            setExportMessage(null);

            const exportData: ExportRow[] = paginatedParticipants.map((stu) => ({
                'Mã sinh viên': stu.studentCode || 'Chưa cập nhật',
                'Tên sinh viên': stu.studentName || 'Chưa cập nhật',
                'Lớp': stu.className || 'Chưa cập nhật',
                'Khoa': stu.facultyName || 'Chưa cập nhật',
                'Ngày đăng ký': formatDateTime(stu.registeredAt),
                'Trạng thái': 'Đã tham gia',
            }));

            const fileName = buildSafeFileName(`danh-sach-da-tham-gia-${activity?.title || 'hoat-dong'}`);

            if (format === 'csv') {
                exportRowsToCsv(exportData, fileName);
            } else {
                exportRowsToXlsx(exportData, fileName);
            }

            setExportMessage(`Xuất ${format.toUpperCase()} thành công!`);
            setTimeout(() => setExportMessage(null), 3000);
        } catch (err: any) {
            setExportError(err?.message || `Lỗi khi xuất ${format.toUpperCase()}`);
        } finally {
            setExportingFormat(null);
        }
    };

    if (loading) return <div className="text-center py-5">Đang tải...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    return (
        <div className={styles.managementWrapper}>
            <div className={styles.header}>
                <div>
                    <h2>Danh sách sinh viên đã tham gia</h2>
                    <p>{activity?.title || 'Hoạt động'}</p>
                </div>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.btnOutline}
                        onClick={() => handleExport('csv')}
                        disabled={exportingFormat === 'csv' || filteredParticipants.length === 0}
                    >
                        <i className="fa-solid fa-file-csv"></i>
                        {exportingFormat === 'csv' ? 'Đang xuất...' : 'Xuất CSV'}
                    </button>
                    <button
                        className={styles.btnOutline}
                        onClick={() => handleExport('xlsx')}
                        disabled={exportingFormat === 'xlsx' || filteredParticipants.length === 0}
                    >
                        <i className="fa-solid fa-file-excel"></i>
                        {exportingFormat === 'xlsx' ? 'Đang xuất...' : 'Xuất Excel'}
                    </button>
                </div>
            </div>

            {exportError && <div className={styles.exportError}>{exportError}</div>}
            {exportMessage && <div className={styles.exportSuccess}>{exportMessage}</div>}

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <label>Tổng đăng ký</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{totalRegistered}</span>
                        <span className={styles.trend}>người</span>
                    </div>
                    <div className={styles.iconBadge} style={{ background: '#dbeafe' }}>
                        <i className="fa-solid fa-users" style={{ color: '#2563eb' }}></i>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <label>Đã tham gia</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{participatedCount}</span>
                        <span className={styles.trend}>người</span>
                    </div>
                    <div className={styles.iconBadge} style={{ background: '#dcfce7' }}>
                        <i className="fa-solid fa-check-circle" style={{ color: '#16a34a' }}></i>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <label>Tỷ lệ hoàn thành</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{participationRate}%</span>
                        <span className={styles.trend}>hoàn thành</span>
                    </div>
                    <div className={styles.iconBadge} style={{ background: '#fef3c7' }}>
                        <i className="fa-solid fa-chart-pie" style={{ color: '#f59e0b' }}></i>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className={styles.tableContainer}>
                <div className={styles.tableFilters}>
                    <div className={styles.leftFilters}>
                        <div className={styles.searchBox}>
                            <i className="fa-solid fa-search"></i>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {classFilterOptions.length > 0 && (
                            <select
                                className={styles.selectBox}
                                value={selectedClassFilter}
                                onChange={(e) => setSelectedClassFilter(e.target.value)}
                            >
                                <option value="ALL">Tất cả lớp</option>
                                {classFilterOptions.map((className) => (
                                    <option key={className} value={className}>
                                        {className}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {paginatedParticipants.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                        <i className="fa-regular fa-folder-open" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                        <p>Chưa có sinh viên đã tham gia hoạt động này</p>
                    </div>
                ) : (
                    <>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}></th>
                                    <th>Mã sinh viên</th>
                                    <th>Tên sinh viên</th>
                                    <th>Lớp</th>
                                    <th>Khoa</th>
                                    <th>Ngày đăng ký</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedParticipants.map((stu, index) => {
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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {shouldPaginate && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={currentPage === i + 1 ? styles.active : ''}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivityFinalizedParticipants;
