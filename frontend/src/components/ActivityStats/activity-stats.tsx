import React from 'react';
import styles from './activity-stats.module.scss';
import { useActivityStats } from '../../hooks/useActivityStats';

type PeriodType = 'month' | 'quarter' | 'year';

const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `Tháng ${i + 1}`,
}));

const quarters = [
    { value: '1', label: 'Quý 1' },
    { value: '2', label: 'Quý 2' },
    { value: '3', label: 'Quý 3' },
    { value: '4', label: 'Quý 4' },
];

const years = ['2024', '2025', '2026', '2027'];

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('vi-VN');
};

const ActivityStats: React.FC = () => {
    const { filters, statsData, loading, error, setFilters } = useActivityStats();

    const onPeriodTypeChange = (value: PeriodType) => {
        setFilters({ periodType: value });
    };

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Thống kê hoạt động</h1>
                    <p className={styles.muted}>Tổng quan hoạt động theo thời gian, danh mục, trạng thái và hiệu suất nổi bật.</p>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label htmlFor="period-type">Chu kỳ</label>
                            <select
                                id="period-type"
                                value={filters.periodType}
                                onChange={(e) => onPeriodTypeChange(e.target.value as PeriodType)}
                            >
                                <option value="month">Theo tháng</option>
                                <option value="quarter">Theo quý</option>
                                <option value="year">Theo năm</option>
                            </select>
                        </div>

                        {filters.periodType === 'month' && (
                            <div className={styles.filterGroup}>
                                <label htmlFor="month">Tháng</label>
                                <select id="month" value={filters.month || ''} onChange={(e) => setFilters({ month: e.target.value })}>
                                    {months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                </select>
                            </div>
                        )}

                        {filters.periodType === 'quarter' && (
                            <div className={styles.filterGroup}>
                                <label htmlFor="quarter">Quý</label>
                                <select id="quarter" value={filters.quarter || '1'} onChange={(e) => setFilters({ quarter: e.target.value })}>
                                    {quarters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                </select>
                            </div>
                        )}

                        <div className={styles.filterGroup}>
                            <label htmlFor="year">Năm</label>
                            <select id="year" value={filters.year} onChange={(e) => setFilters({ year: e.target.value })}>
                                {years.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {error && <div style={{ color: '#e53e3e', marginBottom: 16 }}>{error}</div>}
            {loading && <div style={{ color: '#718096', marginBottom: 16 }}>Đang tải dữ liệu...</div>}

            <div className={styles.kpiRow}>
                <div className={styles.card}>
                    <div className={styles.label}>Tổng số hoạt động</div>
                    <div className={styles.value}>{statsData?.kpi.totalActivities?.toLocaleString() || '—'}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.label}>Tỷ lệ hoạt động bị hủy</div>
                    <div className={styles.value}>{statsData?.kpi.cancellationRate || 0}%</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.label}>Thời gian trung bình</div>
                    <div className={styles.value}>{statsData?.kpi.averageDurationHours || 0} giờ</div>
                </div>
            </div>

            <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                    <div className={styles.insightTitle}>Sắp diễn ra</div>
                    <div className={styles.insightValue}>{statsData?.activitiesByStatus.upcoming || 0}</div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightTitle}>Đang diễn ra</div>
                    <div className={styles.insightValue}>{statsData?.activitiesByStatus.ongoing || 0}</div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightTitle}>Đã kết thúc</div>
                    <div className={styles.insightValue}>{statsData?.activitiesByStatus.completed || 0}</div>
                </div>
            </div>

            <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                    <h3>Hoạt động theo danh mục</h3>
                    {statsData?.activitiesByCategory?.length ? (
                        statsData.activitiesByCategory.slice(0, 8).map((item) => {
                            const total = statsData.kpi.totalActivities || 1;
                            const percent = Number(((item.count / total) * 100).toFixed(2));
                            return <ProgressBar key={item.categoryName} label={item.categoryName} percent={percent} color="#0061ff" />;
                        })
                    ) : (
                        <p className={styles.muted}>Chưa có dữ liệu</p>
                    )}
                </div>
            </div>

            <div className={styles.tableSection}>
                <h3>Top hoạt động nhiều người tham gia nhất</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Hoạt động</th>
                            <th>Ngày bắt đầu</th>
                            <th>Số người tham gia</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statsData?.topByParticipants?.length ? statsData.topByParticipants.map((item) => (
                            <tr key={item.activityId}>
                                <td><strong>{item.title}</strong></td>
                                <td>{formatDate(item.startAt)}</td>
                                <td>{item.participantCount}</td>
                                <td style={{ color: '#0061ff', fontWeight: 700 }}>{item.averageRating}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className={styles.muted}>Chưa có dữ liệu</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.tableSection}>
                <h3>Top hoạt động rating cao nhất</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Hoạt động</th>
                            <th>Ngày bắt đầu</th>
                            <th>Rating</th>
                            <th>Số người tham gia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statsData?.topByRating?.length ? statsData.topByRating.map((item) => (
                            <tr key={item.activityId}>
                                <td><strong>{item.title}</strong></td>
                                <td>{formatDate(item.startAt)}</td>
                                <td style={{ color: '#0061ff', fontWeight: 700 }}>{item.averageRating}</td>
                                <td>{item.participantCount}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className={styles.muted}>Chưa có dữ liệu</td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
            <div className={styles.barFill} style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
    </div>
);

export default ActivityStats;
