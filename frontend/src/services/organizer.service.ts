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
    getMembersByOrganizer: (organizerId: string) => apiService.get(`/organizer-members/organizer/${organizerId}/members`),
    addMemberByEmail: (organizerId: string, payload: { email: string; role: 'ADMIN' | 'MANAGER' | 'MEMBER' }) =>
        apiService.post(`/organizer-members/organizer/${organizerId}/members`, payload),
    updateMemberRole: (memberId: string, role: 'ADMIN' | 'MANAGER' | 'MEMBER') =>
        apiService.patch(`/organizer-members/${memberId}/role`, { role }),
    deleteMember: (memberId: string) => apiService.delete(`/organizer-members/${memberId}`),
}

export default organizerService;