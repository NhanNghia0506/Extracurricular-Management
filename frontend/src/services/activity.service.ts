import { CreateActivity } from "@/types/activity.types";
import apiService from "./api.service";

const activityService = {
    create: (data: CreateActivity) => apiService.post('/activities', data),
}

export default activityService;