import { MyCertificatesResponse, CertificateItem, CertificateVerifyResponse } from '../types/certificate.types';
import { SuccessResponse } from '../types/response.types';
import apiService from './api.service';

const certificateService = {
    getMyCertificates: (params?: { page?: number; limit?: number }) =>
        apiService.get<SuccessResponse<MyCertificatesResponse>>('/certificates/my-certificates', { params }),
    getById: (certificateId: string) =>
        apiService.get<SuccessResponse<CertificateItem>>(`/certificates/${certificateId}`),
    downloadById: (certificateId: string) =>
        apiService.get(`/certificates/${certificateId}/download`, { responseType: 'blob' }),
    verifyByCode: (certificateCode: string, proof?: string) =>
        apiService.get<SuccessResponse<CertificateVerifyResponse>>(`/certificates/verify/${certificateCode}`, {
            params: proof ? { proof } : undefined,
        }),
};

export default certificateService;