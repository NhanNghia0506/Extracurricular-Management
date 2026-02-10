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
    categories: () => apiService.get('/activity-categories'),
    list: () => apiService.get('/activities'),
    getDetail: (id: string) => apiService.get(`/activities/${id}`),
    register: (activityId: string) => apiService.post('/activity-participants', { activityId }),
    participantsByActivity: (activityId: string) => apiService.get(`/activity-participants/participantsByActivity/${activityId}`),
}

export default activityService;