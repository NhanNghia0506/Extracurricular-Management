import { useState, useEffect, useCallback } from 'react';
import studentStatsService, {
    StudentStatsClassFilterOption,
    StudentStatsFilterOption,
} from '../services/student-stats.service';
import academicService from '../services/academic.service';
import { ClassItem, Faculty } from '../types/academic.types';

export interface StatsData {
    kpi: {
        totalStudents: number;
        averageScore: string | number;
        mostActiveActivity: string;
    };
    leaderboard: Array<{
        rank: number;
        name: string;
        studentCode: string;
        className: string;
        activityCount: number;
        trainingScore: number;
    }>;
}

export interface StudentStatsFilters {
    faculty: string;
    className: string;
    month: string;
    year: string;
}

const defaultFilters: StudentStatsFilters = {
    faculty: 'all',
    className: 'all',
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
};

export function useStudentStats(initialFilters: Partial<StudentStatsFilters> = {}) {
    const [filters, setFilters] = useState<StudentStatsFilters>({ ...defaultFilters, ...initialFilters });
    const [statsData, setStatsData] = useState<StatsData | null>(null);
    const [faculties, setFaculties] = useState<StudentStatsFilterOption[]>([]);
    const [classes, setClasses] = useState<StudentStatsClassFilterOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFaculties = useCallback(async () => {
        try {
            const response = await academicService.getFaculties();
            if (response.data.success) {
                const nextFaculties = (response.data.data || []) as Faculty[];
                setFaculties(nextFaculties.map((faculty) => ({
                    value: faculty._id,
                    label: faculty.name,
                })));
                return;
            }

            setFaculties([]);
        } catch {
            setFaculties([]);
        }
    }, []);

    const fetchClassesByFaculty = useCallback(async (facultyId?: string) => {
        if (!facultyId || facultyId === 'all') {
            setClasses([]);
            return;
        }

        try {
            const response = await academicService.getClassesByFaculty(facultyId);
            if (response.data.success) {
                const nextClasses = (response.data.data || []) as ClassItem[];
                setClasses(nextClasses.map((classItem) => ({
                    value: classItem._id,
                    label: classItem.name,
                    facultyId,
                })));
                return;
            }

            setClasses([]);
        } catch {
            setClasses([]);
        }
    }, []);

    const fetchStats = useCallback(async (nextFilters: StudentStatsFilters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await studentStatsService.getStudentStats(nextFilters);
            setStatsData(data);
        } catch {
            setError('Không thể tải dữ liệu thống kê.');
            setStatsData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats(filters);
    }, [fetchStats, filters]);

    useEffect(() => {
        void fetchFaculties();
    }, [fetchFaculties]);

    useEffect(() => {
        void fetchClassesByFaculty(filters.faculty);
    }, [fetchClassesByFaculty, filters.faculty]);

    const updateFilters = (override: Partial<StudentStatsFilters>) => {
        setFilters((prev) => ({ ...prev, ...override }));
    };

    return {
        filters,
        statsData,
        faculties,
        classes,
        loading,
        error,
        setFilters: updateFilters,
        refresh: () => fetchStats(filters),
    };
}
