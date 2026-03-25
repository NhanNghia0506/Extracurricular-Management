import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faDownload,
    faFilter,
    faRotateRight,
    faStar,
    faUserGraduate,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useTrainingScoreReport } from '../../hooks/useTrainingScoreReport';
import academicService from '../../services/academic.service';
import trainingScoreReportService from '../../services/trainingScoreReport.service';
import { ClassItem, Faculty } from '../../types/academic.types';
import {
    TrainingScoreClassRow,
    TrainingScoreFacultyRow,
    TrainingScoreReportRow,
    TrainingScoreReportView,
    TrainingScoreStudentRow,
} from '../../types/training-score-report.types';
import { buildSafeFileName, exportRowsToCsv, exportRowsToXlsx } from '../../utils/export-report';
import { useToast } from '../../contexts/ToastContext';
import styles from './training.score.report.module.scss';

const isStudentRow = (row: TrainingScoreReportRow): row is TrainingScoreStudentRow => {
    return 'studentId' in row;
};

const isClassRow = (row: TrainingScoreReportRow): row is TrainingScoreClassRow => {
    return 'classId' in row && 'studentCount' in row;
};

const isFacultyRow = (row: TrainingScoreReportRow): row is TrainingScoreFacultyRow => {
    return 'facultyId' in row && 'classCount' in row;
};

const viewLabels: Record<TrainingScoreReportView, string> = {
    student: 'Theo sinh viên',
    class: 'Theo lớp',
    faculty: 'Theo khoa',
};

const TrainingScoreReport: React.FC = () => {
    const { showToast } = useToast();
    const {
        filters,
        report,
        loading,
        error,
        setDateRange,
        setFacultyId,
        setClassId,
        setView,
        refresh,
        goNextPage,
        goPrevPage,
    } = useTrainingScoreReport();

    const [faculties, setFaculties] = React.useState<Faculty[]>([]);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [exporting, setExporting] = React.useState(false);

    React.useEffect(() => {
        const loadFaculties = async () => {
            try {
                const response = await academicService.getFaculties();
                if (response.data.success) {
                    setFaculties(response.data.data);
                }
            } catch {
                setFaculties([]);
            }
        };

        void loadFaculties();
    }, []);

    React.useEffect(() => {
        const loadClasses = async () => {
            if (!filters.facultyId) {
                setClasses([]);
                return;
            }

            try {
                const response = await academicService.getClassesByFaculty(filters.facultyId);
                if (response.data.success) {
                    setClasses(response.data.data);
                }
            } catch {
                setClasses([]);
            }
        };

        void loadClasses();
    }, [filters.facultyId]);

    const handleDateChange = (field: 'fromDate' | 'toDate', value: string) => {
        const nextFromDate = field === 'fromDate' ? value : filters.fromDate;
        const nextToDate = field === 'toDate' ? value : filters.toDate;
        setDateRange(nextFromDate, nextToDate);
    };

    const mapRowsForExport = (rows: TrainingScoreReportRow[]): Record<string, string | number>[] => {
        if (filters.view === 'student') {
            return rows.filter(isStudentRow).map((row, index) => ({
                STT: index + 1,
                MSSV: row.studentCode,
                'Họ và tên': row.studentName,
                Email: row.email,
                Lớp: row.className,
                Khoa: row.facultyName,
                'Số hoạt động hoàn thành': row.completedActivities,
                'Tổng điểm rèn luyện': row.totalTrainingScore,
            }));
        }

        if (filters.view === 'class') {
            return rows.filter(isClassRow).map((row, index) => ({
                STT: index + 1,
                Lớp: row.className,
                Khoa: row.facultyName,
                'Số sinh viên': row.studentCount,
                'Số hoạt động hoàn thành': row.completedActivities,
                'Tổng điểm rèn luyện': row.totalTrainingScore,
                'Điểm trung bình': row.averageTrainingScore,
            }));
        }

        return rows.filter(isFacultyRow).map((row, index) => ({
            STT: index + 1,
            Khoa: row.facultyName,
            'Số lớp': row.classCount,
            'Số sinh viên': row.studentCount,
            'Số hoạt động hoàn thành': row.completedActivities,
            'Tổng điểm rèn luyện': row.totalTrainingScore,
            'Điểm trung bình': row.averageTrainingScore,
        }));
    };

    const handleExport = async (format: 'csv' | 'xlsx') => {
        setExporting(true);
        try {
            const exportData = await trainingScoreReportService.getReport({
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
                facultyId: filters.facultyId || undefined,
                classId: filters.classId || undefined,
                view: filters.view,
                page: 1,
                limit: 5000,
            });

            if (exportData.items.length === 0) {
                showToast({
                    type: 'error',
                    title: 'Không có dữ liệu',
                    message: 'Không có dữ liệu để xuất báo cáo với bộ lọc hiện tại.',
                });
                return;
            }

            const rows = mapRowsForExport(exportData.items);
            const filePrefix = buildSafeFileName(`training-score-${filters.view}`);

            if (format === 'csv') {
                exportRowsToCsv(rows, `${filePrefix}.csv`);
            } else {
                exportRowsToXlsx(rows, `${filePrefix}.xlsx`, 'TrainingScore');
            }

            showToast({
                type: 'success',
                title: 'Xuất báo cáo thành công',
                message: `Đã xuất ${rows.length} dòng dữ liệu (${viewLabels[filters.view]}).`,
            });
        } catch {
            showToast({
                type: 'error',
                title: 'Xuất báo cáo thất bại',
                message: 'Hệ thống không thể xuất báo cáo lúc này.',
            });
        } finally {
            setExporting(false);
        }
    };

    const renderTableHead = () => {
        if (filters.view === 'student') {
            return (
                <tr>
                    <th>Sinh viên</th>
                    <th>Lớp</th>
                    <th>Khoa</th>
                    <th>Hoạt động hoàn thành</th>
                    <th>Tổng điểm</th>
                </tr>
            );
        }

        if (filters.view === 'class') {
            return (
                <tr>
                    <th>Lớp</th>
                    <th>Khoa</th>
                    <th>Số sinh viên</th>
                    <th>Tổng điểm</th>
                    <th>Điểm trung bình</th>
                </tr>
            );
        }

        return (
            <tr>
                <th>Khoa</th>
                <th>Số lớp</th>
                <th>Số sinh viên</th>
                <th>Tổng điểm</th>
                <th>Điểm trung bình</th>
            </tr>
        );
    };

    const renderTableRows = () => {
        if (!report || report.items.length === 0) {
            return (
                <tr>
                    <td colSpan={5} className={styles.emptyCell}>Không có dữ liệu theo bộ lọc hiện tại.</td>
                </tr>
            );
        }

        if (filters.view === 'student') {
            return report.items.filter(isStudentRow).map((row) => (
                <tr key={row.studentId}>
                    <td>
                        <div className={styles.mainCell}>
                            <strong>{row.studentName}</strong>
                            <span>{row.studentCode} - {row.email}</span>
                        </div>
                    </td>
                    <td>{row.className}</td>
                    <td>{row.facultyName}</td>
                    <td>{row.completedActivities}</td>
                    <td className={styles.scoreCell}>+{row.totalTrainingScore}</td>
                </tr>
            ));
        }

        if (filters.view === 'class') {
            return report.items.filter(isClassRow).map((row) => (
                <tr key={row.classId}>
                    <td>{row.className}</td>
                    <td>{row.facultyName}</td>
                    <td>{row.studentCount}</td>
                    <td className={styles.scoreCell}>+{row.totalTrainingScore}</td>
                    <td>{row.averageTrainingScore}</td>
                </tr>
            ));
        }

        return report.items.filter(isFacultyRow).map((row) => (
            <tr key={row.facultyId}>
                <td>{row.facultyName}</td>
                <td>{row.classCount}</td>
                <td>{row.studentCount}</td>
                <td className={styles.scoreCell}>+{row.totalTrainingScore}</td>
                <td>{row.averageTrainingScore}</td>
            </tr>
        ));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Báo cáo điểm rèn luyện</h1>
                    <p>Tổng hợp trainingScore theo sinh viên, lớp, khoa từ các hoạt động đã hoàn thành.</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.btnGhost} onClick={() => void refresh()} disabled={loading}>
                        <FontAwesomeIcon icon={faRotateRight} /> Làm mới
                    </button>
                    <button className={styles.btnPrimary} onClick={() => void handleExport('csv')} disabled={exporting || loading}>
                        <FontAwesomeIcon icon={faDownload} /> Xuất CSV
                    </button>
                    <button className={styles.btnPrimary} onClick={() => void handleExport('xlsx')} disabled={exporting || loading}>
                        <FontAwesomeIcon icon={faDownload} /> Xuất XLSX
                    </button>
                </div>
            </header>

            <section className={styles.filterCard}>
                <div className={styles.filterTitle}>
                    <FontAwesomeIcon icon={faFilter} /> Bộ lọc báo cáo
                </div>
                <div className={styles.filterGrid}>
                    <label>
                        Từ ngày
                        <input type="date" value={filters.fromDate} onChange={(e) => handleDateChange('fromDate', e.target.value)} />
                    </label>
                    <label>
                        Đến ngày
                        <input type="date" value={filters.toDate} onChange={(e) => handleDateChange('toDate', e.target.value)} />
                    </label>
                    <label>
                        Khoa
                        <select value={filters.facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                            <option value="">Tất cả khoa</option>
                            {faculties.map((faculty) => (
                                <option key={faculty._id} value={faculty._id}>{faculty.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Lớp
                        <select value={filters.classId} onChange={(e) => setClassId(e.target.value)} disabled={!filters.facultyId}>
                            <option value="">Tất cả lớp</option>
                            {classes.map((item) => (
                                <option key={item._id} value={item._id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className={styles.tabs}>
                    {(['student', 'class', 'faculty'] as const).map((view) => (
                        <button
                            key={view}
                            className={filters.view === view ? styles.tabActive : styles.tab}
                            onClick={() => setView(view)}
                        >
                            {viewLabels[view]}
                        </button>
                    ))}
                </div>
            </section>

            <section className={styles.statsGrid}>
                <article className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.blue}`}><FontAwesomeIcon icon={faStar} /></div>
                    <div>
                        <label>Tổng điểm rèn luyện</label>
                        <div className={styles.value}>{report?.summary.totalTrainingScore ?? 0}</div>
                    </div>
                </article>
                <article className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.green}`}><FontAwesomeIcon icon={faUserGraduate} /></div>
                    <div>
                        <label>Tổng sinh viên</label>
                        <div className={styles.value}>{report?.summary.totalStudents ?? 0}</div>
                    </div>
                </article>
                <article className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.orange}`}><FontAwesomeIcon icon={faUsers} /></div>
                    <div>
                        <label>Điểm trung bình</label>
                        <div className={styles.value}>{report?.summary.averageTrainingScore ?? 0}</div>
                    </div>
                </article>
            </section>

            <section className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <h3>Chi tiết báo cáo ({viewLabels[filters.view]})</h3>
                    <div className={styles.paginationIcons}>
                        <button onClick={goPrevPage} disabled={loading || !report?.pagination.hasPrevPage}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button onClick={goNextPage} disabled={loading || !report?.pagination.hasNextPage}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>

                <div className={styles.metaInfo}>
                    <span>Trang {report?.pagination.page ?? 1}/{report?.pagination.totalPages ?? 1}</span>
                    <span>Tổng bản ghi: {report?.pagination.total ?? 0}</span>
                </div>

                {loading && <p className={styles.statusText}>Đang tải dữ liệu báo cáo...</p>}
                {!loading && error && <p className={styles.errorText}>{error}</p>}

                <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                        <thead>{renderTableHead()}</thead>
                        <tbody>{renderTableRows()}</tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default TrainingScoreReport;