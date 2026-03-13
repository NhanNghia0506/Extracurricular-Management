import apiService from "./api.service";
import { OrganizerApprovalDashboardResponse, OrganizerApprovalDetailResponse, OrganizerApprovalReviewPayload } from "@/types/organizer.types";
import { SuccessResponse } from "@/types/response.types";

const organizerService = {
    create: (formData: FormData) => apiService.post('/organizers', formData),
    getAll: () => apiService.get('/organizers'),
    approvalDashboard: () => apiService.get<SuccessResponse<OrganizerApprovalDashboardResponse>>('/organizers/admin/approval'),
    approvalDetail: (id: string) => apiService.get<SuccessResponse<OrganizerApprovalDetailResponse>>(`/organizers/admin/approval/${id}`),
    reviewApproval: (id: string, payload: OrganizerApprovalReviewPayload) => apiService.patch<SuccessResponse<OrganizerApprovalDetailResponse>>(`/organizers/admin/approval/${id}`, payload),
    myOrganizations: (userId: string) => apiService.get(`/organizer-members/my-organizations/${userId}`),
}

export default organizerService;