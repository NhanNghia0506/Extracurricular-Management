import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck, faStar, faPercentage, faFilter,
    faMapMarkerAlt, faChevronLeft, faChevronRight, faArrowRight,
    faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import styles from './attendance.history.module.scss';
import { useMyAttendanceHistory } from '../../hooks/useMyAttendanceHistory';
import { AttendanceCheckinStatus } from '../../types/attendance-history.types';

const AttendanceHistory: React.FC = () => {
    const {
        items,
        summary,
        pagination,
        loading,
        error,
        filters,
        setStartDate,
        setEndDate,
        setStatus,
        goNextPage,
        goPrevPage,
        refresh,
    } = useMyAttendanceHistory();

    const getStatusLabel = React.useCallback((status: AttendanceCheckinStatus): string => {
        if (status === 'SUCCESS') {
            return 'Đúng giờ';
        }

        if (status === 'LATE') {
            return 'Muộn';
        }

        return 'Vắng';
    }, []);

    const getStatusClass = React.useCallback((status: AttendanceCheckinStatus): string => {
        if (status === 'SUCCESS') {
            return styles.statusGreen;
        }

        if (status === 'LATE') {
            return styles.statusYellow;
        }

        return styles.statusRed;
    }, []);

    const formatDate = React.useCallback((isoDate?: string): string => {
        if (!isoDate) {
            return '--';
        }

        const date = new Date(isoDate);
        if (Number.isNaN(date.getTime())) {
            return '--';
        }

        return date.toLocaleDateString('vi-VN');
    }, []);

    const formatDateTime = React.useCallback((isoDate?: string): string => {
        if (!isoDate) {
            return '--';
        }

        const date = new Date(isoDate);
        if (Number.isNaN(date.getTime())) {
            return '--';
        }

        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    const cycleStatusFilter = React.useCallback(() => {
        const current = filters.status.join(',');

        if (!current) {
            setStatus(['SUCCESS', 'LATE']);
            return;
        }

        if (current === 'SUCCESS,LATE') {
            setStatus(['FAILED']);
            return;
        }

        setStatus([]);
    }, [filters.status, setStatus]);

    const statusFilterLabel = React.useMemo(() => {
        const current = filters.status.join(',');
        if (!current) {
            return 'Bộ lọc: Tất cả';
        }

        if (current === 'SUCCESS,LATE') {
            return 'Bộ lọc: Có điểm';
        }

        return 'Bộ lọc: Vắng';
    }, [filters.status]);

    const displayCumulativeTrainingScore = React.useMemo(() => {
        return summary.cumulativeTrainingScore;
    }, [summary.cumulativeTrainingScore]);

    return (
        <div className={styles.container}>
            {/* Header trang */}
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1>Lịch sử điểm danh</h1>
                    <p>Theo dõi sự hiện diện và tích lũy điểm rèn luyện của bạn.</p>
                </div>
                <div className={styles.actions}>
                    <div className={styles.dateRange}>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            aria-label="Từ ngày"
                        />
                        <span>đến</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            aria-label="Đến ngày"
                        />
                    </div>
                    <button className={styles.btnFilter} onClick={cycleStatusFilter}>
                        <FontAwesomeIcon icon={faFilter} />
                        {statusFilterLabel}
                    </button>
                    <button className={styles.btnFilter} onClick={() => void refresh()}>
                        <FontAwesomeIcon icon={faRotateRight} />
                        Làm mới
                    </button>
                    {/* <button className={styles.btnExport} onClick={handleExportClick}>
                        <FontAwesomeIcon icon={faFileExport} /> Xuất báo cáo
                    </button> */}
                </div>
            </header>

            {/* 1. Thẻ thống kê (AttendanceStats) */}
            <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.blue}`}><FontAwesomeIcon icon={faCalendarCheck} /></div>
                    <div className={styles.statContent}>
                        <label>HOẠT ĐỘNG THAM GIA</label>
                        <div className={styles.value}>
                            {summary.totalParticipatedActivities}
                            <small>/ {summary.totalSessions} phiên</small>
                        </div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.green}`}><FontAwesomeIcon icon={faStar} /></div>
                    <div className={styles.statContent}>
                        <label>ĐIỂM RÈN LUYỆN</label>
                        <div className={styles.value}>{displayCumulativeTrainingScore} <small>pts</small></div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.red}`}><FontAwesomeIcon icon={faPercentage} /></div>
                    <div className={styles.statContent}>
                        <label>TỶ LỆ CHUYÊN CẦN</label>
                        <div className={styles.value}>{summary.attendanceRate} <small>%</small></div>
                    </div>
                </div>
            </section>

            {/* 2. Bảng hoạt động (ActivityTable) */}
            <section className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <h3>Danh sách hoạt động gần đây</h3>
                    <div className={styles.paginationIcons}>
                        <button onClick={goPrevPage} disabled={loading || !pagination.hasPrevPage}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button onClick={goNextPage} disabled={loading || !pagination.hasNextPage}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>

                <div className={styles.metaInfo}>
                    <span>Trang {pagination.page}/{pagination.totalPages}</span>
                    <span>Tổng bản ghi: {pagination.total}</span>
                </div>

                {loading && <p className={styles.statusText}>Đang tải lịch sử điểm danh...</p>}
                {!loading && error && <p className={styles.errorText}>{error}</p>}

                <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>HOẠT ĐỘNG</th>
                                <th>TÊN PHIÊN ĐIỂM DANH</th>
                                <th>THỜI GIAN ĐIỂM DANH</th>
                                <th>ĐỊA ĐIỂM</th>
                                <th>TRẠNG THÁI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.emptyCell}>
                                        Không có dữ liệu điểm danh trong khoảng thời gian đã chọn.
                                    </td>
                                </tr>
                            )}

                            {items.map((item) => {
                                return (
                                    <tr key={item.checkinId}>
                                        <td>
                                            <div className={styles.activityInfo}>
                                                <div className={styles.actIcon}>👥</div>
                                                <div>
                                                    <strong>{item.activityTitle}</strong>
                                                    <span>{item.organizerName || 'Đơn vị tổ chức chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>{item.sessionTitle || '--'}</strong>
                                        </td>
                                        <td>
                                            <div className={styles.timeCell}>
                                                <strong>{formatDate(item.checkinTime)}</strong>
                                                <span>{formatDateTime(item.checkinTime)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.locationCell}>
                                                <FontAwesomeIcon icon={faMapMarkerAlt} /> {item.locationAddress || '--'}
                                            </div>
                                        </td>
                                        <td className={styles.statusCell}>
                                            <span className={`${styles.badge} ${getStatusClass(item.status)}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <button className={styles.viewAllBtn} onClick={() => void refresh()}>
                    Tải lại lịch sử tham gia <FontAwesomeIcon icon={faArrowRight} />
                </button>
            </section>
        </div>
    );
};

export default AttendanceHistory;