import type { CreateCheckinSession } from '@/types/checkin-session.types';
import apiService from './api.service';
import authService from './auth.service';

const checkinSessionService = {
    create: (data: CreateCheckinSession) => apiService.post('/checkin-sessions', data),
    getById: (id: string) => apiService.get(`/checkin-sessions/${id}`),
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
