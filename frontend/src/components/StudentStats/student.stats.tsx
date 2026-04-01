import React from 'react';
import styles from './student.stats.module.scss';
import { useStudentStats } from '../../hooks/useStudentStats';
import { useToast } from '../../contexts/ToastContext';

const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `Tháng ${i + 1}`,
}));
const years = ['2024', '2025', '2026'];

const StudentStats: React.FC = () => {
    const { filters, statsData, faculties, classes, setFilters } = useStudentStats();
    const { showToast } = useToast();

    return (
        <div className={styles.dashboard}>
            {/* HEADER */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Thống kê sinh viên tích cực</h1>
                    <p style={{ color: '#718096' }}>Phân tích chuyên sâu về các hoạt động ngoại khóa...</p>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label htmlFor="faculty-select">Khoa</label>
                            <select
                                id="faculty-select"
                                value={filters.faculty}
                                onChange={(e) => setFilters({ faculty: e.target.value, className: 'all' })}
                            >
                                <option value="all">Tất cả khoa</option>
                                {faculties.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="class-select">Lớp</label>
                            <select
                                id="class-select"
                                value={filters.className}
                                onChange={(e) => setFilters({ className: e.target.value })}
                            >
                                <option value="all">Tất cả lớp</option>
                                {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="month-select">Tháng</label>
                            <select
                                id="month-select"
                                value={filters.month}
                                onChange={(e) => setFilters({ month: e.target.value })}
                            >
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="year-select">Năm</label>
                            <select
                                id="year-select"
                                value={filters.year}
                                onChange={(e) => setFilters({ year: e.target.value })}
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* KPI CARDS */}
            <div className={styles.kpiRow}>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>👥</div>
                    <div className={styles.label}>Tổng số sinh viên tham gia</div>
                    <div className={styles.value}>{statsData?.kpi?.totalStudents?.toLocaleString() || '—'}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ background: '#e6fffa', color: '#38a169' }}>★</div>
                    <div className={styles.label}>Điểm rèn luyện trung bình</div>
                    <div className={styles.value}>{statsData?.kpi?.averageScore || '—'}</div>
                </div>
                <div className={`${styles.card} ${styles.blueActive}`}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(255,255,255,0.2)' }}>⚡</div>
                    <div className={styles.label}>Hoạt động sôi nổi nhất</div>
                    <div className={styles.value} style={{ fontSize: '20px' }}>{statsData?.kpi?.mostActiveActivity || '—'}</div>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                    <h3>Xu hướng tham gia</h3>
                    {/* Bar Chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '200px', paddingBottom: '20px' }}>
                        {statsData?.participationTrend?.data?.map((h, i) => (
                            <div key={i} style={{ flex: 1, background: i === 6 ? '#0061ff' : '#dbeafe', height: `${h}%`, borderRadius: '8px' }}></div>
                        )) || <p style={{ textAlign: 'center', color: '#718096' }}>Chưa có dữ liệu</p>}
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <h3>Phân bổ điểm rèn luyện</h3>
                    <ProgressBar label="Xuất sắc (90-100)" percent={statsData?.scoreDistribution?.excellent || 0} color="#3182ce" />
                    <ProgressBar label="Tốt (80-89)" percent={statsData?.scoreDistribution?.good || 0} color="#38a169" />
                    <ProgressBar label="Khá (70-79)" percent={statsData?.scoreDistribution?.fair || 0} color="#e53e3e" />
                    <ProgressBar label="Trung bình (<70)" percent={statsData?.scoreDistribution?.average || 0} color="#cbd5e0" />
                </div>
            </div>

            {/* LEADERBOARD */}
            <div className={styles.leaderboard}>
                <div className={styles.tableHeader}>
                    <h2>Top 10 Sinh viên tích cực nhất</h2>
                    <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }} onClick={() => showToast({ type: 'info', title: 'Chức năng đang phát triển', message: 'Xuất báo cáo sẽ sớm có!' })}>📤 Xuất báo cáo</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Xếp hạng</th>
                            <th>Sinh viên</th>
                            <th>Mã SV / Lớp</th>
                            <th>Hoạt động</th>
                            <th>Tổng điểm</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statsData?.leaderboard?.map((student, idx) => (
                            <tr key={idx}>
                                <td><div className={`${styles.rankCircle} ${idx === 0 ? styles.gold : idx === 1 ? styles.silver : idx === 2 ? styles.bronze : ''}`}>{student.rank}</div></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#eee' }}></div>
                                        <strong>{student.name}</strong>
                                    </div>
                                </td>
                                <td>{student.studentCode} <br /><small>{student.className}</small></td>
                                <td>{student.activityCount}</td>
                                <td style={{ color: '#0061ff', fontWeight: 'bold' }}>{student.trainingScore}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ textAlign: 'center', marginTop: '20px', color: '#0061ff', cursor: 'pointer', fontWeight: 600 }}>Xem danh sách đầy đủ (50+)</div>
            </div>
        </div>
    );
};


// Component con cho Progress Bar
const ProgressBar = ({ label, percent, color }: any) => (
    <div className={styles.progressWrapper}>
        <div className={styles.labelRow}>
            <span>{label}</span>
            <span>{percent}%</span>
        </div>
        <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${percent}%`, backgroundColor: color }}></div>
        </div>
    </div>
);

export default StudentStats;