import { CreateActivity } from "@/types/activity.types";
import apiService from "./api.service";
import axios from "axios";

const activityService = {
    create: (data: CreateActivity) => apiService.post('/activities', data),
    createWithFile: (formData: FormData) => {
        // Gửi FormData với header Content-Type multipart/form-data
        const token = localStorage.getItem(process.env.REACT_APP_AUTH_TOKEN_KEY || 'authToken');
        return axios.post(
            `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/activities`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
    },
    categories: () => apiService.get('/activity-categories'),
}

export default activityService;