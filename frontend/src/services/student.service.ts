import apiService from './api.service';
import { SuccessResponse } from '../types/response.types';

export interface StudentFullInfoResponse {
    id: string;
    mssv: string;
    name: string;
    email: string;
    avatar?: string | null;
    class: string;
    faculty: string;
}

const studentService = {
    getStudentFullInfo: (userId: string) =>
        apiService.get<SuccessResponse<StudentFullInfoResponse>>(`/students/${userId}`),
};

export default studentService;
