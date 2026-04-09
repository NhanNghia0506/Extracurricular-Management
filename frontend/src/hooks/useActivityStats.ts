import { useEffect, useState } from 'react';
import activityStatsService, { ActivityStatsFilters, ActivityStatsResponse } from '../services/activity-stats.service';

const now = new Date();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const currentQuarter = String(Math.floor(now.getMonth() / 3) + 1);

const defaultFilters: ActivityStatsFilters = {
    periodType: 'month',
    month: currentMonth,
    quarter: currentQuarter,
    year: String(now.getFullYear()),
};

export function useActivityStats(initialFilters: Partial<ActivityStatsFilters> = {}) {
    const [filters, setFilters] = useState<ActivityStatsFilters>({ ...defaultFilters, ...initialFilters });
    const [statsData, setStatsData] = useState<ActivityStatsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await activityStatsService.getActivityStats(filters);
                setStatsData(data);
            } catch {
                setError('Không thể tải dữ liệu thống kê hoạt động.');
                setStatsData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [filters]);

    const updateFilters = (override: Partial<ActivityStatsFilters>) => {
        setFilters((prev) => ({ ...prev, ...override }));
    };

    return {
        filters,
        statsData,
        loading,
        error,
        setFilters: updateFilters,
    };
}
