import apiService from './api.service';
import { CheckinResponse } from '../types/checkin.types';
import {
    AttendanceHistoryQueryParams,
    AttendanceHistoryResponse,
} from '../types/attendance-history.types';

export class CheckinService {
    /**
     * Lấy danh sách người đã checkin theo sessionId
     * @param sessionId - ID của checkin session
     * @param status - Lọc theo trạng thái (SUCCESS | FAILED)
     */
    async getCheckinsBySessionId(
        sessionId: string,
        status?: 'SUCCESS' | 'LATE' | 'FAILED'
    ): Promise<{ total: number; data: CheckinResponse[] }> {
        const params = status ? { status } : {};
        const response = await apiService.get(`/checkins/session/${sessionId}`, { params });
        return response.data.data;
    }

    async getMyAttendanceHistory(
        params: AttendanceHistoryQueryParams,
    ): Promise<AttendanceHistoryResponse> {
        const response = await apiService.get('/checkins/my-history', {
            params: {
                startDate: params.startDate,
                endDate: params.endDate,
                page: params.page,
                limit: params.limit,
                status: params.status?.join(','),
            },
        });

        return response.data.data;
    }

    async manualCheckin(checkinSessionId: string, userId: string) {
        const response = await apiService.post('/checkins/manual', {
            checkinSessionId,
            userId,
        });

        return response.data;
    }
}

const checkinService = new CheckinService();
export default checkinService;
