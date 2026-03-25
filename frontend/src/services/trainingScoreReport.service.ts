import apiService from './api.service';
import { SuccessResponse } from '../types/response.types';
import {
    TrainingScoreReportQueryParams,
    TrainingScoreReportResponse,
} from '../types/training-score-report.types';

class TrainingScoreReportService {
    async getReport(params: TrainingScoreReportQueryParams): Promise<TrainingScoreReportResponse> {
        const response = await apiService.get<SuccessResponse<TrainingScoreReportResponse>>(
            '/checkins/admin/training-score-report',
            {
                params: {
                    fromDate: params.fromDate,
                    toDate: params.toDate,
                    facultyId: params.facultyId,
                    classId: params.classId,
                    page: params.page,
                    limit: params.limit,
                    view: params.view,
                },
            },
        );

        return response.data.data;
    }
}

const trainingScoreReportService = new TrainingScoreReportService();
export default trainingScoreReportService;