import {
    ActivityApprovalDashboardResponse,
    ActivityApprovalDetailResponse,
    ActivityApprovalReviewPayload,
    CreateActivity,
} from "@/types/activity.types";
import { SuccessResponse } from "@/types/response.types";
import apiService from "./api.service";

const activityService = {
    create: (data: CreateActivity) => apiService.post(`/activities?organizerId=${data.organizerId}&categoryId=${data.categoryId}`, data),
    createWithFile: (organizerId: string, categoryId: string, formData: FormData) => {
        return apiService.post(
            `/activities?organizerId=${organizerId}&categoryId=${categoryId}`,
            formData
        );
    },
    updateWithFile: (activityId: string, formData: FormData) => {
        return apiService.put(`/activities/${activityId}`, formData);
    },
    delete: (activityId: string) => apiService.delete(`/activities/${activityId}`),
    categories: () => apiService.get('/activity-categories'),
    list: () => apiService.get('/activities'),
    getDetail: (id: string) => apiService.get(`/activities/${id}`),
    approvalDashboard: () => apiService.get<SuccessResponse<ActivityApprovalDashboardResponse>>('/activities/admin/approval'),
    approvalDetail: (id: string) => apiService.get<SuccessResponse<ActivityApprovalDetailResponse>>(`/activities/admin/approval/${id}`),
    reviewApproval: (id: string, payload: ActivityApprovalReviewPayload) => apiService.patch<SuccessResponse<ActivityApprovalDetailResponse>>(`/activities/admin/approval/${id}`, payload),
    register: (activityId: string) => apiService.post('/activity-participants', { activityId }),
    participantsByActivity: (activityId: string) => apiService.get(`/activity-participants/participantsByActivity/${activityId}`),
    participantsCountByActivity: async (activityId: string): Promise<number> => {
        const response = await apiService.get(`/activity-participants/countByActivity/${activityId}`);
        const count = response.data?.data;
        return typeof count === 'number' ? count : Number(count) || 0;
    },
    myActivities: () => apiService.get('/activities/my-activities'),
}

export default activityService;