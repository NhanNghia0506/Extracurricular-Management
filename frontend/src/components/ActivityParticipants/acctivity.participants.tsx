import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import styles from './acctivity.participants.module.scss';
import activityService from '../../services/activity.service';
import { ParticipantItem, ParticipantStatus } from '@/types/participan.types';


const ActivityParticipants: React.FC = () => {
    const { activityId: routeActivityId } = useParams<{ activityId?: string }>();
    const [searchParams] = useSearchParams();
    const activityId = searchParams.get('activityId') || routeActivityId || '';

    const [participants, setParticipants] = useState<ParticipantItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
        if (!searchTerm.trim()) return participants;
        const keyword = searchTerm.toLowerCase();
        return participants.filter((p) => {
            const name = p.studentName?.toLowerCase() || '';
            const code = p.studentCode?.toLowerCase() || '';
            return name.includes(keyword) || code.includes(keyword);
        });
    }, [participants, searchTerm]);

    const totalRegistered = participants.length;
    const confirmedCount = participants.filter((p) => p.status === 'APPROVED').length;
    const pendingCount = participants.filter((p) => p.status === 'PENDING').length;

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
                return { label: 'Confirmed', className: 'confirmed' };
            case 'PENDING':
                return { label: 'Pending', className: 'pending' };
            case 'REJECTED':
                return { label: 'Rejected', className: 'pending' };
            case 'CANCELLED':
                return { label: 'Cancelled', className: 'pending' };
            default:
                return { label: status || 'Unknown', className: 'pending' };
        }
    };

    const formatRegisteredAt = (value?: string) => {
        const date = value ? new Date(value) : new Date();
        const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(safeDate);
    };

    return (
        <div className={styles.managementWrapper}>
            {/* 1. Header */}
            <header className={styles.header}>
                <div>
                    <h2>Danh sách tham gia hoạt động</h2>
                    <p>{activityId ? `Activity ID: ${activityId}` : 'Vui lòng cung cấp activityId'}</p>
                </div>
                <div className={styles.actionButtons}>
                    <button className={styles.btnOutline}><i className="fa-solid fa-download"></i> Export to Excel</button>
                    <button className={styles.btnPrimary}><i className="fa-solid fa-bolt"></i> Bulk Action</button>
                </div>
            </header>

            {/* 2. Thống kê nhanh */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <label>Total Registered</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{totalRegistered}</span>
                        <span className={`${styles.trend} ${styles.up}`}><i className="fa-solid fa-arrow-trend-up"></i> +0%</span>
                    </div>
                    <div className={styles.iconBadge} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}><i className="fa-solid fa-users"></i></div>
                </div>

                <div className={styles.statCard}>
                    <label>Confirmed</label>
                    <div className={styles.valueContainer}>
                        <span className={styles.number}>{confirmedCount}</span>
                        <span className={`${styles.trend} ${styles.up}`}><i className="fa-solid fa-arrow-trend-up"></i> +0%</span>
                    </div>
                    <div className={styles.iconBadge} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}><i className="fa-solid fa-check"></i></div>
                </div>

                <div className={styles.statCard}>
                    <label>Pending</label>
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
                                placeholder="Search by student name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select className={styles.selectBox}><option>All Classes</option></select>
                        <select className={styles.selectBox}><option>All Statuses</option></select>
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
                                    <td className="fw-bold">{stu.studentCode || 'N/A'}</td>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            <div className={styles.avatar} style={{ backgroundColor: `hsla(${index * 50}, 70%, 90%, 1)`, color: `hsla(${index * 50}, 70%, 40%, 1)` }}>
                                                {initials}
                                            </div>
                                            {stu.studentName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>{stu.className || 'N/A'}</td>
                                    <td>{stu.facultyName || 'N/A'}</td>
                                    <td>{formatRegisteredAt(stu.registeredAt)}</td>
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
                    <span>Showing <b>{filteredParticipants.length}</b> of <b>{participants.length}</b> students</span>
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