import type { CreateCheckinSession } from '@/types/checkin-session.types';
import apiService from './api.service';
import authService from './auth.service';
import activityService from './activity.service';
import type { ActivityDetailResponse } from '@/types/activity.types';

const checkinSessionService = {
    create: (data: CreateCheckinSession) => apiService.post('/checkin-sessions', data),
    getById: (id: string) => apiService.get(`/checkin-sessions/${id}`),
    getByActivityId: (activityId: string) => apiService.get(`/checkin-sessions/activity/${activityId}`),
    getActivityBySessionId: async (sessionId: string): Promise<ActivityDetailResponse> => {
        const sessionResponse = await apiService.get(`/checkin-sessions/${sessionId}`);
        const sessionData = sessionResponse.data?.data;

        if (!sessionData?.activityId) {
            throw new Error('Không tìm thấy activityId từ checkin session');
        }

        const activityId =
            typeof sessionData.activityId === 'string'
                ? sessionData.activityId
                : sessionData.activityId._id;

        if (!activityId) {
            throw new Error('activityId không hợp lệ');
        }

        const activityResponse = await activityService.getDetail(activityId);
        return activityResponse.data?.data;
    },
    checkin: (checkinSessionId: string, latitude: number, longitude: number) => {
        const deviceId = authService.getDeviceId();
        const userInfo = authService.getUserInfoFromStorage();

        if (!deviceId) {
            throw new Error('Device ID not found. Please login again.');
        }
        if (!userInfo?.id) {
            throw new Error('User ID not found. Please login again.');
        }

        return apiService.post(`/checkins`, {
            checkinSessionId,
            latitude,
            longitude,
            deviceId,
            userId: userInfo.id
        });
    },
};

export default checkinSessionService;
