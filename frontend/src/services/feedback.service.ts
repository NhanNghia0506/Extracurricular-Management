import apiService from './api.service';
import {
    ActivityFeedbackDashboardResponse,
    ActivityFeedbackItem,
    ActivityFeedbackListResponse,
    CreateActivityFeedbackPayload,
    ListActivityFeedbackQuery,
    UpdateActivityFeedbackPayload,
} from '../types/feedback.types';

const feedbackService = {
    async listByActivity(
        activityId: string,
        query: ListActivityFeedbackQuery = {},
    ): Promise<ActivityFeedbackListResponse> {
        const limit = query.limit ?? 10;
        const skip = query.skip ?? 0;
        const sort = query.sort ?? 'newest';

        const response = await apiService.get(
            `/activities/${activityId}/feedback?limit=${limit}&skip=${skip}&sort=${sort}`,
        );

        return response.data.data;
    },

    async getDashboard(activityId: string): Promise<ActivityFeedbackDashboardResponse> {
        const response = await apiService.get(`/activities/${activityId}/feedback/dashboard`);
        return response.data.data;
    },

    async create(
        activityId: string,
        payload: CreateActivityFeedbackPayload,
    ): Promise<ActivityFeedbackItem> {
        const response = await apiService.post(`/activities/${activityId}/feedback`, payload);
        return response.data.data;
    },

    async update(
        feedbackId: string,
        payload: UpdateActivityFeedbackPayload,
    ): Promise<ActivityFeedbackItem> {
        const response = await apiService.patch(`/activity-feedback/${feedbackId}`, payload);
        return response.data.data;
    },
};

export default feedbackService;
