import apiService from './api.service';
import {
    ComplaintDashboardResponse,
    ComplaintHistoryItem,
    ComplaintItem,
    ComplaintListResponse,
    ComplaintResponseItem,
    CreateComplaintResponsePayload,
    CreateComplaintPayload,
    ListComplaintQuery,
    ReviewComplaintPayload,
    UploadedComplaintAttachment,
} from '../types/complaint.types';

const complaintService = {
    async uploadAttachment(file: File): Promise<UploadedComplaintAttachment> {
        const formData = new FormData();
        formData.append('image', file);

        const response = await apiService.post('/complaints/upload-attachment', formData);
        return response.data.data;
    },

    async create(payload: CreateComplaintPayload): Promise<ComplaintItem> {
        const response = await apiService.post('/complaints', payload);
        return response.data.data;
    },

    async listMine(query: ListComplaintQuery = {}): Promise<ComplaintListResponse> {
        const response = await apiService.get('/complaints', { params: query });
        return response.data.data;
    },

    async getMineById(id: string): Promise<ComplaintItem> {
        const response = await apiService.get(`/complaints/${id}`);
        return response.data.data;
    },

    async listMineResponses(id: string): Promise<ComplaintResponseItem[]> {
        const response = await apiService.get(`/complaints/${id}/responses`);
        return response.data.data;
    },

    async addMineResponse(id: string, payload: CreateComplaintResponsePayload): Promise<ComplaintResponseItem> {
        const response = await apiService.post(`/complaints/${id}/responses`, payload);
        return response.data.data;
    },

    async listMineHistory(id: string): Promise<ComplaintHistoryItem[]> {
        const response = await apiService.get(`/complaints/${id}/history`);
        return response.data.data;
    },

    async listAdmin(query: ListComplaintQuery = {}): Promise<ComplaintListResponse> {
        const response = await apiService.get('/admin/complaints', { params: query });
        return response.data.data;
    },

    async listOrganizer(organizerId: string, query: ListComplaintQuery = {}): Promise<ComplaintListResponse> {
        const response = await apiService.get('/admin/complaints', { params: { ...query, organizerId } });
        return response.data.data;
    },

    async getAdminById(id: string): Promise<ComplaintItem> {
        const response = await apiService.get(`/admin/complaints/${id}`);
        return response.data.data;
    },

    async getOrganizerById(organizerId: string, id: string): Promise<ComplaintItem> {
        const response = await apiService.get(`/admin/complaints/${id}`, { params: { organizerId } });
        return response.data.data;
    },

    async listAdminResponses(id: string): Promise<ComplaintResponseItem[]> {
        const response = await apiService.get(`/admin/complaints/${id}/responses`);
        return response.data.data;
    },

    async listOrganizerResponses(organizerId: string, id: string): Promise<ComplaintResponseItem[]> {
        const response = await apiService.get(`/admin/complaints/${id}/responses`, { params: { organizerId } });
        return response.data.data;
    },

    async addAdminResponse(id: string, payload: CreateComplaintResponsePayload): Promise<ComplaintResponseItem> {
        const response = await apiService.post(`/admin/complaints/${id}/responses`, payload);
        return response.data.data;
    },

    async addOrganizerResponse(organizerId: string, id: string, payload: CreateComplaintResponsePayload): Promise<ComplaintResponseItem> {
        const response = await apiService.post(`/admin/complaints/${id}/responses`, payload, { params: { organizerId } });
        return response.data.data;
    },

    async listAdminHistory(id: string): Promise<ComplaintHistoryItem[]> {
        const response = await apiService.get(`/admin/complaints/${id}/history`);
        return response.data.data;
    },

    async listOrganizerHistory(organizerId: string, id: string): Promise<ComplaintHistoryItem[]> {
        const response = await apiService.get(`/admin/complaints/${id}/history`, { params: { organizerId } });
        return response.data.data;
    },

    async review(id: string, payload: ReviewComplaintPayload): Promise<ComplaintItem> {
        const response = await apiService.patch(`/admin/complaints/${id}/review`, payload);
        return response.data.data;
    },

    async reviewOrganizer(organizerId: string, id: string, payload: ReviewComplaintPayload): Promise<ComplaintItem> {
        const response = await apiService.patch(`/admin/complaints/${id}/review`, payload, { params: { organizerId } });
        return response.data.data;
    },

    async getAdminDashboard(): Promise<ComplaintDashboardResponse> {
        const response = await apiService.get('/admin/complaints/dashboard');
        return response.data.data;
    },

    async getOrganizerDashboard(organizerId: string): Promise<ComplaintDashboardResponse> {
        const response = await apiService.get('/admin/complaints/dashboard', { params: { organizerId } });
        return response.data.data;
    },
};

export default complaintService;
