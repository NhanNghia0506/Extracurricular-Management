import apiService from './api.service';

interface StudentStatsResponse {
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

export interface StudentStatsFilterOption {
    value: string;
    label: string;
}

export interface StudentStatsClassFilterOption extends StudentStatsFilterOption {
    facultyId: string;
}

interface StudentStatsFilterOptionsResponse {
    faculties: StudentStatsFilterOption[];
    classes: StudentStatsClassFilterOption[];
}

class StudentStatsService {
    async getStudentStats(filters: {
        faculty?: string;
        className?: string;
        month: string;
        year: string;
    }): Promise<StudentStatsResponse> {
        try {
            const response = await apiService.get<{ data: StudentStatsResponse }>(
                '/checkins/admin/student-stats',
                {
                    params: {
                        faculty: filters.faculty && filters.faculty !== 'all' ? filters.faculty : undefined,
                        className: filters.className && filters.className !== 'all' ? filters.className : undefined,
                        month: filters.month,
                        year: filters.year,
                    },
                },
            );

            return response.data.data;
        } catch (error) {
            console.error('Error fetching student stats:', error);
            throw error;
        }
    }

    async getStudentStatsFilterOptions(facultyId?: string): Promise<StudentStatsFilterOptionsResponse> {
        try {
            const response = await apiService.get<{ data: StudentStatsFilterOptionsResponse }>(
                '/checkins/admin/student-stats/filter-options',
                {
                    params: {
                        facultyId: facultyId && facultyId !== 'all' ? facultyId : undefined,
                    },
                },
            );

            return response.data.data;
        } catch (error) {
            console.error('Error fetching student stats filter options:', error);
            throw error;
        }
    }
}

const studentStatsServiceInstance = new StudentStatsService();
export default studentStatsServiceInstance;
