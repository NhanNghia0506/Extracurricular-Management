import { MyCertificatesResponse, CertificateItem } from '../types/certificate.types';
import { SuccessResponse } from '../types/response.types';
import apiService from './api.service';

const certificateService = {
    getMyCertificates: (params?: { page?: number; limit?: number }) =>
        apiService.get<SuccessResponse<MyCertificatesResponse>>('/certificates/my-certificates', { params }),
    getById: (certificateId: string) =>
        apiService.get<SuccessResponse<CertificateItem>>(`/certificates/${certificateId}`),
    downloadById: (certificateId: string) =>
        apiService.get(`/certificates/${certificateId}/download`, { responseType: 'blob' }),
};

export default certificateService;