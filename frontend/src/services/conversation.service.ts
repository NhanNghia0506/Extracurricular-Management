import apiService from "./api.service";

interface CreateConversationDto {
    activityId: string;
    title: string;
    addAllMembers?: boolean;
}

interface UpdateLastMessageDto {
    content: string;
    userId: string;
    userName: string;
}

const conversationService = {
    create: (data: CreateConversationDto) =>
        apiService.post('/conversations', data),

    getByActivity: (activityId: string) =>
        apiService.get(`/conversations/activity/${activityId}`),

    getById: (id: string) =>
        apiService.get(`/conversations/${id}`),

    getMembers: (id: string) =>
        apiService.get(`/conversations/${id}/members`),

    addMember: (id: string, userId: string, role: string = 'member') =>
        apiService.post(`/conversations/${id}/members`, { userId, role }),

    updateLastMessage: (id: string, data: UpdateLastMessageDto) =>
        apiService.patch(`/conversations/${id}/last-message`, data),

    markAsRead: (id: string, userId: string) =>
        apiService.patch(`/conversations/${id}/read`, { userId }),

    getUserConversations: (userId: string) =>
        apiService.get(`/conversations/user/${userId}`),

    getRecommendedConversations: () =>
        apiService.get('/conversations/recommended/me'),
};

export default conversationService;
