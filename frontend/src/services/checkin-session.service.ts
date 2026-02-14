import type { CreateCheckinSession } from '@/types/checkin-session.types';
import apiService from './api.service';

const checkinSessionService = {
    create: (data: CreateCheckinSession) => apiService.post('/checkin-sessions', data),
};

export default checkinSessionService;
