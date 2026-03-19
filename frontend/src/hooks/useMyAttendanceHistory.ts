import { useCallback, useEffect, useState } from 'react';
import checkinService from '../services/checkin.service';
import {
    AttendanceCheckinStatus,
    AttendanceHistoryItem,
    AttendanceHistoryPagination,
    AttendanceHistorySummary,
} from '../types/attendance-history.types';

const DEFAULT_LIMIT = 10;

const DEFAULT_SUMMARY: AttendanceHistorySummary = {
    totalParticipatedActivities: 0,
    cumulativeTrainingScore: 0,
    attendanceRate: 0,
    totalSessions: 0,
    successCount: 0,
    lateCount: 0,
    failedCount: 0,
};

const DEFAULT_PAGINATION: AttendanceHistoryPagination = {
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

interface UseMyAttendanceHistoryResult {
    items: AttendanceHistoryItem[];
    summary: AttendanceHistorySummary;
    pagination: AttendanceHistoryPagination;
    loading: boolean;
    error: string | null;
    filters: {
        startDate: string;
        endDate: string;
        status: AttendanceCheckinStatus[];
    };
    setStartDate: (value: string) => void;
    setEndDate: (value: string) => void;
    setStatus: (value: AttendanceCheckinStatus[]) => void;
    goNextPage: () => void;
    goPrevPage: () => void;
    refresh: () => Promise<void>;
}

export const useMyAttendanceHistory = (): UseMyAttendanceHistoryResult => {
    const [items, setItems] = useState<AttendanceHistoryItem[]>([]);
    const [summary, setSummary] = useState<AttendanceHistorySummary>(DEFAULT_SUMMARY);
    const [pagination, setPagination] = useState<AttendanceHistoryPagination>(DEFAULT_PAGINATION);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [status, setStatus] = useState<AttendanceCheckinStatus[]>([]);

    const fetchPage = useCallback(async (targetPage: number) => {
        try {
            setLoading(true);
            setError(null);

            const data = await checkinService.getMyAttendanceHistory({
                page: targetPage,
                limit: DEFAULT_LIMIT,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: status.length > 0 ? status : undefined,
            });

            setItems(data.items);
            setSummary(data.summary);
            setPagination(data.pagination);
        } catch (err: any) {
            setItems([]);
            setSummary(DEFAULT_SUMMARY);
            setPagination((prev) => ({ ...prev, page: targetPage }));
            setError(err.response?.data?.message || 'Không thể tải lịch sử điểm danh.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, status]);

    const refresh = useCallback(async () => {
        await fetchPage(1);
    }, [fetchPage]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const goNextPage = useCallback(() => {
        if (loading || !pagination.hasNextPage) {
            return;
        }

        void fetchPage(pagination.page + 1);
    }, [fetchPage, loading, pagination.hasNextPage, pagination.page]);

    const goPrevPage = useCallback(() => {
        if (loading || !pagination.hasPrevPage) {
            return;
        }

        void fetchPage(pagination.page - 1);
    }, [fetchPage, loading, pagination.hasPrevPage, pagination.page]);

    return {
        items,
        summary,
        pagination,
        loading,
        error,
        filters: {
            startDate,
            endDate,
            status,
        },
        setStartDate,
        setEndDate,
        setStatus,
        goNextPage,
        goPrevPage,
        refresh,
    };
};
