import apiService from './api.service';
import { Faculty, ClassItem } from '../types/academic.types';
import { ApiResponse } from '../types/response.types';

const academicService = {
    getFaculties: () => apiService.get<ApiResponse<Faculty[]>>('/academic/faculties'),
    getClassesByFaculty: (facultyId: string) =>
        apiService.get<ApiResponse<ClassItem[]>>(`/academic/classes?facultyId=${facultyId}`),
};

export default academicService;
