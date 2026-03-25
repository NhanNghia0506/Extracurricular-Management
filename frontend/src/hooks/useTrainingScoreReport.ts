import React from 'react';
import trainingScoreReportService from '../services/trainingScoreReport.service';
import {
    TrainingScoreReportQueryParams,
    TrainingScoreReportResponse,
    TrainingScoreReportView,
} from '../types/training-score-report.types';

type TrainingScoreFilters = {
    fromDate: string;
    toDate: string;
    facultyId: string;
    classId: string;
    view: TrainingScoreReportView;
    page: number;
    limit: number;
};

const buildDefaultFilters = (): TrainingScoreFilters => ({
    fromDate: '',
    toDate: '',
    facultyId: '',
    classId: '',
    view: 'student',
    page: 1,
    limit: 20,
});

export const useTrainingScoreReport = () => {
    const [filters, setFilters] = React.useState<TrainingScoreFilters>(buildDefaultFilters);
    const [report, setReport] = React.useState<TrainingScoreReportResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchReport = React.useCallback(async (nextFilters: TrainingScoreFilters) => {
        setLoading(true);
        setError(null);

        const params: TrainingScoreReportQueryParams = {
            fromDate: nextFilters.fromDate || undefined,
            toDate: nextFilters.toDate || undefined,
            facultyId: nextFilters.facultyId || undefined,
            classId: nextFilters.classId || undefined,
            page: nextFilters.page,
            limit: nextFilters.limit,
            view: nextFilters.view,
        };

        try {
            const data = await trainingScoreReportService.getReport(params);
            setReport(data);
            setFilters(nextFilters);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Không thể tải báo cáo điểm rèn luyện';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const applyFilters = React.useCallback((override?: Partial<TrainingScoreFilters>) => {
        const nextFilters: TrainingScoreFilters = {
            ...filters,
            ...override,
        };

        void fetchReport(nextFilters);
    }, [fetchReport, filters]);

    React.useEffect(() => {
        void fetchReport(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setDateRange = React.useCallback((fromDate: string, toDate: string) => {
        applyFilters({ fromDate, toDate, page: 1 });
    }, [applyFilters]);

    const setFacultyId = React.useCallback((facultyId: string) => {
        applyFilters({ facultyId, classId: '', page: 1 });
    }, [applyFilters]);

    const setClassId = React.useCallback((classId: string) => {
        applyFilters({ classId, page: 1 });
    }, [applyFilters]);

    const setView = React.useCallback((view: TrainingScoreReportView) => {
        applyFilters({ view, page: 1 });
    }, [applyFilters]);

    const goNextPage = React.useCallback(() => {
        if (!report?.pagination.hasNextPage) {
            return;
        }
        applyFilters({ page: filters.page + 1 });
    }, [applyFilters, filters.page, report?.pagination.hasNextPage]);

    const goPrevPage = React.useCallback(() => {
        if (!report?.pagination.hasPrevPage) {
            return;
        }
        applyFilters({ page: Math.max(1, filters.page - 1) });
    }, [applyFilters, filters.page, report?.pagination.hasPrevPage]);

    return {
        filters,
        report,
        loading,
        error,
        setDateRange,
        setFacultyId,
        setClassId,
        setView,
        refresh: () => applyFilters(),
        goNextPage,
        goPrevPage,
    };
};