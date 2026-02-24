import { CreateActivity } from "@/types/activity.types";
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
    categories: () => apiService.get('/activity-categories'),
    list: () => apiService.get('/activities'),
    getDetail: (id: string) => apiService.get(`/activities/${id}`),
    register: (activityId: string) => apiService.post('/activity-participants', { activityId }),
    participantsByActivity: (activityId: string) => apiService.get(`/activity-participants/participantsByActivity/${activityId}`),
    myActivities: () => apiService.get('/activities/my-activities'),
}

export default activityService;