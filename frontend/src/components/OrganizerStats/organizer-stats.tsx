import React from 'react';
import styles from './organizer-stats.module.scss';
import { useOrganizerStats } from '../../hooks/useOrganizerStats';

const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `Tháng ${i + 1}`,
}));

const years = ['2024', '2025', '2026'];

const OrganizerStats: React.FC = () => {
    const { filters, statsData, loading, error, setFilters } = useOrganizerStats();

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Thống kê ban tổ chức năng động</h1>
                    <p style={{ color: '#718096' }}>Theo dõi đơn vị tổ chức sôi nổi, hoạt động được đánh giá cao và danh mục thu hút nhất.</p>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label htmlFor="month-select">Tháng</label>
                            <select id="month-select" value={filters.month} onChange={(e) => setFilters({ month: e.target.value })}>
                                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="year-select">Năm</label>
                            <select id="year-select" value={filters.year} onChange={(e) => setFilters({ year: e.target.value })}>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="sort-by-select">Xếp hạng theo</label>
                            <select
                                id="sort-by-select"
                                value={filters.sortBy || 'activityCount'}
                                onChange={(e) => setFilters({ sortBy: e.target.value as 'activityCount' | 'participantCount' | 'averageRating' })}
                            >
                                <option value="activityCount">Số hoạt động</option>
                                <option value="participantCount">Số người tham gia</option>
                                <option value="averageRating">Điểm đánh giá</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {error && <div style={{ color: '#e53e3e', marginBottom: 16 }}>{error}</div>}
            {loading && <div style={{ color: '#718096', marginBottom: 16 }}>Đang tải dữ liệu...</div>}

            <div className={styles.kpiRow}>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>🏢</div>
                    <div className={styles.label}>Tổng ban tổ chức có hoạt động</div>
                    <div className={styles.value}>{statsData?.kpi.totalOrganizers?.toLocaleString() || '—'}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>🎯</div>
                    <div className={styles.label}>Tổng số hoạt động</div>
                    <div className={styles.value}>{statsData?.kpi.totalActivities?.toLocaleString() || '—'}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>👥</div>
                    <div className={styles.label}>Tổng lượt tham gia</div>
                    <div className={styles.value}>{statsData?.kpi.totalParticipants?.toLocaleString() || '—'}</div>
                </div>
            </div>

            <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                    <div className={styles.insightTitle}>Ban tổ chức sôi nổi nhất</div>
                    <div className={styles.insightValue}>{statsData?.kpi.topOrganizer || '—'}</div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightTitle}>Hoạt động được đánh giá cao nhất</div>
                    <div className={styles.insightValue}>{statsData?.kpi.topRatedActivity || '—'}</div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightTitle}>Loại hoạt động tham gia nhiều nhất</div>
                    <div className={styles.insightValue}>{statsData?.kpi.mostParticipatedCategory || '—'}</div>
                </div>
            </div>

            <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                    <h3>Phân bổ chất lượng đánh giá</h3>
                    <ProgressBar label="Xuất sắc (>= 4.5)" percent={statsData?.ratingDistribution.excellent || 0} color="#0061ff" />
                    <ProgressBar label="Tốt (4.0 - 4.4)" percent={statsData?.ratingDistribution.good || 0} color="#38a169" />
                    <ProgressBar label="Khá (3.0 - 3.9)" percent={statsData?.ratingDistribution.fair || 0} color="#d69e2e" />
                    <ProgressBar label="Thấp (< 3.0)" percent={statsData?.ratingDistribution.low || 0} color="#e53e3e" />
                    <div style={{ marginTop: 14, fontWeight: 700, color: '#1a202c' }}>
                        Điểm đánh giá trung bình: {statsData?.kpi.averageRating || 0}
                    </div>
                </div>
            </div>

            <div className={styles.leaderboard}>
                <div className={styles.tableHeader}>
                    <h2>Top 10 Ban tổ chức nổi bật</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Xếp hạng</th>
                            <th>Ban tổ chức</th>
                            <th>Số hoạt động</th>
                            <th>Số người tham gia</th>
                            <th>Đánh giá TB</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statsData?.organizerLeaderboard?.map((item, idx) => (
                            <tr key={item.organizerId}>
                                <td>
                                    <div className={`${styles.rankCircle} ${idx === 0 ? styles.gold : idx === 1 ? styles.silver : idx === 2 ? styles.bronze : ''}`}>
                                        {item.rank}
                                    </div>
                                </td>
                                <td><strong>{item.organizerName}</strong></td>
                                <td>{item.activityCount}</td>
                                <td>{item.participantCount}</td>
                                <td style={{ color: '#0061ff', fontWeight: 700 }}>{item.averageRating}</td>
                            </tr>
                        ))}
                        {!statsData?.organizerLeaderboard?.length && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: '#718096' }}>Chưa có dữ liệu</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.topActivities}>
                <h3>Top hoạt động được đánh giá cao</h3>
                {statsData?.topActivities?.length ? statsData.topActivities.map((activity) => (
                    <div className={styles.activityItem} key={`${activity.title}-${activity.organizerName}`}>
                        <div>
                            <strong>{activity.title}</strong>
                            <div className={styles.activityMeta}>{activity.organizerName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <strong>{activity.averageRating} ★</strong>
                            <div className={styles.activityMeta}>{activity.participantCount} người tham gia</div>
                        </div>
                    </div>
                )) : (
                    <p style={{ color: '#718096' }}>Chưa có dữ liệu</p>
                )}
            </div>
        </div>
    );
};

const ProgressBar = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
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

export default OrganizerStats;
