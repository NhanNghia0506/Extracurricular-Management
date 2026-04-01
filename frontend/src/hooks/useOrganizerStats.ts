import { useEffect, useState } from 'react';
import organizerStatsService, { OrganizerStatsFilters, OrganizerStatsResponse } from '../services/organizer-stats.service';

const defaultFilters: OrganizerStatsFilters = {
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
    sortBy: 'activityCount',
};

export function useOrganizerStats(initialFilters: Partial<OrganizerStatsFilters> = {}) {
    const [filters, setFilters] = useState<OrganizerStatsFilters>({ ...defaultFilters, ...initialFilters });
    const [statsData, setStatsData] = useState<OrganizerStatsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await organizerStatsService.getOrganizerStats(filters);
                setStatsData(data);
            } catch {
                setError('Không thể tải dữ liệu thống kê ban tổ chức.');
                setStatsData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [filters]);

    const updateFilters = (override: Partial<OrganizerStatsFilters>) => {
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
