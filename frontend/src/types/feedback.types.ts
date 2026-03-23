export interface ActivityFeedbackItem {
    id: string;
    activityId: string;
    authorId: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    canEdit: boolean;
}

export interface ActivityFeedbackListResponse {
    items: ActivityFeedbackItem[];
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

export interface ActivityFeedbackDashboardResponse {
    totalFeedbacks: number;
    averageRating: number;
    ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
    recentFeedbacks: ActivityFeedbackItem[];
}

export interface CreateActivityFeedbackPayload {
    rating: number;
    comment: string;
}

export interface UpdateActivityFeedbackPayload {
    rating?: number;
    comment?: string;
}

export interface ListActivityFeedbackQuery {
    limit?: number;
    skip?: number;
    sort?: 'newest' | 'oldest';
}
