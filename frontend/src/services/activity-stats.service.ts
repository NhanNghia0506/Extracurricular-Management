import apiService from './api.service';

export type ActivityStatsPeriodType = 'month' | 'quarter' | 'year';

export interface ActivityStatsFilters {
    periodType: ActivityStatsPeriodType;
    month?: string;
    quarter?: string;
    year: string;
}

export interface ActivityStatsResponse {
    kpi: {
        totalActivities: number;
        cancellationRate: number;
        averageDurationHours: number;
    };
    activitiesByStatus: {
        upcoming: number;
        ongoing: number;
        completed: number;
    };
    activitiesByCategory: Array<{
        categoryName: string;
        count: number;
    }>;
    periodTrend: {
        labels: string[];
        data: number[];
    };
    topByParticipants: Array<{
        activityId: string;
        title: string;
        participantCount: number;
        averageRating: number;
        startAt: string;
    }>;
    topByRating: Array<{
        activityId: string;
        title: string;
        participantCount: number;
        averageRating: number;
        startAt: string;
    }>;
}

class ActivityStatsService {
    async getActivityStats(filters: ActivityStatsFilters): Promise<ActivityStatsResponse> {
        const response = await apiService.get<{ data: ActivityStatsResponse }>('/activities/admin/stats', {
            params: {
                periodType: filters.periodType,
                month: filters.month,
                quarter: filters.quarter,
                year: filters.year,
            },
        });

        return response.data.data;
    }
}

const activityStatsService = new ActivityStatsService();
export default activityStatsService;
