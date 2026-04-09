export interface ActivityStatsResponseDto {
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
        startAt: Date;
    }>;
    topByRating: Array<{
        activityId: string;
        title: string;
        participantCount: number;
        averageRating: number;
        startAt: Date;
    }>;
}
