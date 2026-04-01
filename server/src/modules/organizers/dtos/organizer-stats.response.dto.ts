export interface OrganizerStatsResponseDto {
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
