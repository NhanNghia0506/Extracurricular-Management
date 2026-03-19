export type AttendanceCheckinStatus = 'SUCCESS' | 'LATE' | 'FAILED';

export interface AttendanceHistorySummary {
    totalParticipatedActivities: number;
    cumulativeTrainingScore: number;
    attendanceRate: number;
    totalSessions: number;
    successCount: number;
    lateCount: number;
    failedCount: number;
}

export interface AttendanceHistoryItem {
    checkinId: string;
    activityId: string;
    activityTitle: string;
    organizerName?: string;
    activityStartAt?: string;
    activityEndAt?: string;
    sessionId: string;
    sessionTitle: string;
    checkinTime: string;
    locationAddress: string;
    status: AttendanceCheckinStatus;
    trainingScore: number;
    awardedPoints: number;
}

export interface AttendanceHistoryPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface AttendanceHistoryResponse {
    summary: AttendanceHistorySummary;
    items: AttendanceHistoryItem[];
    pagination: AttendanceHistoryPagination;
}

export interface AttendanceHistoryQueryParams {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    status?: AttendanceCheckinStatus[];
}
