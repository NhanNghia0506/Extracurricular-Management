import apiService from './api.service';
import { Faculty, ClassItem, CreateFacultyPayload, CreateClassPayload } from '../types/academic.types';
import { ApiResponse } from '../types/response.types';

const academicService = {
    getFaculties: () => apiService.get<ApiResponse<Faculty[]>>('/academic/faculties'),
    getClassesByFaculty: (facultyId: string) =>
        apiService.get<ApiResponse<ClassItem[]>>(`/academic/classes?facultyId=${facultyId}`),
    createFaculty: (payload: CreateFacultyPayload) =>
        apiService.post<ApiResponse<Faculty>>('/academic/faculty', payload),
    createClass: (payload: CreateClassPayload) =>
        apiService.post<ApiResponse<ClassItem>>('/academic/class', payload),
};

export default academicService;
