import apiService from './api.service';

export interface OrganizerStatsResponse {
    kpi: {
        totalOrganizers: number;
        totalActivities: number;
        totalParticipants: number;
        averageRating: number;
        topOrganizer: string;
        topRatedActivity: string;
        mostParticipatedCategory: string;
    };
    activityTrend: {
        labels: string[];
        data: number[];
    };
    ratingDistribution: {
        excellent: number;
        good: number;
        fair: number;
        low: number;
    };
    organizerLeaderboard: Array<{
        rank: number;
        organizerId: string;
        organizerName: string;
        activityCount: number;
        participantCount: number;
        averageRating: number;
    }>;
    topActivities: Array<{
        title: string;
        organizerName: string;
        participantCount: number;
        averageRating: number;
    }>;
}

export interface OrganizerStatsFilters {
    month: string;
    year: string;
    sortBy?: 'activityCount' | 'participantCount' | 'averageRating';
}

class OrganizerStatsService {
    async getOrganizerStats(filters: OrganizerStatsFilters): Promise<OrganizerStatsResponse> {
        const response = await apiService.get<{ data: OrganizerStatsResponse }>('/organizers/admin/stats', {
            params: {
                month: filters.month,
                year: filters.year,
                sortBy: filters.sortBy || 'activityCount',
            },
        });

        return response.data.data;
    }
}

const organizerStatsService = new OrganizerStatsService();
export default organizerStatsService;
