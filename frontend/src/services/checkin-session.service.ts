import type { CreateCheckinSession } from '@/types/checkin-session.types';
import apiService from './api.service';

const checkinSessionService = {
    create: (data: CreateCheckinSession) => apiService.post('/checkin-sessions', data),
    getById: (id: string) => apiService.get(`/checkin-sessions/${id}`),
    checkin: (checkinSessionId: string, latitude: number, longitude: number) => 
        apiService.post(`/checkins`, { checkinSessionId, latitude, longitude }),
};

export default checkinSessionService;
