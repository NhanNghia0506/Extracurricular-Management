export interface ActivityComment {
    id: string;
    activityId: string;
    parentCommentId: string | null;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    edited: boolean;
    canEdit: boolean;
    canDelete: boolean;
    replies: ActivityComment[];
}

export interface ListActivityCommentsResponse {
    items: ActivityComment[];
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

export interface CreateActivityCommentPayload {
    content: string;
    parentCommentId?: string;
}

export interface UpdateActivityCommentPayload {
    content: string;
}

export interface DeleteActivityCommentResponse {
    deletedCommentIds: string[];
    deletedCount: number;
}
