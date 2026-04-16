import apiService from './api.service';
import { Message, CreateMessagePayload, UpdateMessagePayload, UploadedMessageImage } from '../types/message.types';

const BASE_URL = '/messages';

export const messageService = {
    async uploadImage(file: File): Promise<UploadedMessageImage> {
        const formData = new FormData();
        formData.append('image', file);

        const response = await apiService.post(`${BASE_URL}/upload-image`, formData);
        return response.data.data;
    },

    // Tạo tin nhắn mới
    async createMessage(payload: CreateMessagePayload): Promise<Message> {
        const response = await apiService.post(`${BASE_URL}`, payload);
        return response.data.data;
    },

    // Lấy tin nhắn theo ID
    async getMessageById(messageId: string): Promise<Message> {
        const response = await apiService.get(`${BASE_URL}/${messageId}`);
        return response.data.data;
    },

    // Lấy các tin nhắn của một conversation
    async getConversationMessages(
        conversationId: string,
        limit: number = 50,
        skip: number = 0,
    ): Promise<Message[]> {
        const response = await apiService.get(
            `${BASE_URL}/conversation/${conversationId}?limit=${limit}&skip=${skip}`,
        );
        return Array.isArray(response.data.data) ? response.data.data : [];
    },

    // Lấy các tin nhắn của một user
    async getUserMessages(senderId: string): Promise<Message[]> {
        const response = await apiService.get(`${BASE_URL}/user/${senderId}`);
        return Array.isArray(response.data.data) ? response.data.data : [];
    },

    // Cập nhật tin nhắn
    async updateMessage(
        messageId: string,
        payload: UpdateMessagePayload,
    ): Promise<Message> {
        const response = await apiService.put(`${BASE_URL}/${messageId}`, payload);
        return response.data.data;
    },

    // Xoá tin nhắn
    async deleteMessage(messageId: string): Promise<any> {
        const response = await apiService.delete(`${BASE_URL}/${messageId}`);
        return response.data.data;
    },

    // Đánh dấu tin nhắn là đã đọc
    async markAsRead(conversationId: string): Promise<any> {
        const response = await apiService.put(`${BASE_URL}/${conversationId}/mark-as-read`, {});
        return response.data.data;
    },

    // Thêm reaction
    async addReaction(messageId: string, emoji: string): Promise<Message> {
        const response = await apiService.post(
            `${BASE_URL}/${messageId}/reactions/${emoji}`,
            {},
        );
        return response.data.data;
    },

    // Xoá reaction
    async removeReaction(messageId: string, emoji: string): Promise<Message> {
        const response = await apiService.delete(
            `${BASE_URL}/${messageId}/reactions/${emoji}`,
        );
        return response.data.data;
    },

    // Lấy số lượng tin nhắn trong conversation
    async getConversationMessageCount(conversationId: string): Promise<number> {
        const response = await apiService.get(
            `${BASE_URL}/conversation/${conversationId}/count`,
        );
        return response.data.count;
    },
};

export default messageService;
