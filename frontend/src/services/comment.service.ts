import apiService from './api.service';
import {
    ActivityComment,
    CreateActivityCommentPayload,
    DeleteActivityCommentResponse,
    ListActivityCommentsResponse,
    UpdateActivityCommentPayload,
} from '../types/comment.types';

const commentService = {
    async listByActivity(
        activityId: string,
        limit: number = 20,
        skip: number = 0,
        sort: 'newest' | 'oldest' = 'newest',
    ): Promise<ListActivityCommentsResponse> {
        const response = await apiService.get(
            `/activities/${activityId}/comments?limit=${limit}&skip=${skip}&sort=${sort}`,
        );

        return response.data.data;
    },

    async create(
        activityId: string,
        payload: CreateActivityCommentPayload,
    ): Promise<ActivityComment> {
        const response = await apiService.post(`/activities/${activityId}/comments`, payload);
        return response.data.data;
    },

    async update(
        commentId: string,
        payload: UpdateActivityCommentPayload,
    ): Promise<ActivityComment> {
        const response = await apiService.patch(`/comments/${commentId}`, payload);
        return response.data.data;
    },

    async delete(commentId: string): Promise<DeleteActivityCommentResponse> {
        const response = await apiService.delete(`/comments/${commentId}`);
        return response.data.data;
    },
};

export default commentService;
