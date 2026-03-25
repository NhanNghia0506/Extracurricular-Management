import { SuccessResponse } from '@/types/response.types';
import apiService from './api.service';

export interface ActivityCategory {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateActivityCategoryPayload {
    name: string;
}

const activityCategoryService = {
    getAll: () => apiService.get<SuccessResponse<ActivityCategory[]>>('/activity-categories'),
    getById: (id: string) => apiService.get<SuccessResponse<ActivityCategory>>(`/activity-categories/${id}`),
    create: (payload: CreateActivityCategoryPayload) => apiService.post<SuccessResponse<ActivityCategory>>('/activity-categories', payload),
    update: (id: string, payload: CreateActivityCategoryPayload) => apiService.put<SuccessResponse<ActivityCategory>>(`/activity-categories/${id}`, payload),
    delete: (id: string) => apiService.delete<SuccessResponse<null>>(`/activity-categories/${id}`),
};

export default activityCategoryService;
