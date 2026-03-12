import { SuccessResponse } from '../types/response.types';
import {
    CreateNotificationRequest,
    NotificationsQuery,
    NotificationsResponse,
    NotificationItem,
    NotificationPriority,
    NotificationType,
    UnreadNotificationsResponse,
} from '../types/notification.types';
import apiService from './api.service';

export interface SendActivityNotificationRequest {
    recipientMode: 'ALL' | 'SELECTED';
    recipientUserIds?: string[];
    title: string;
    message: string;
    senderName?: string;
    senderType?: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    linkUrl?: string;
    groupKey?: string;
    meta?: Record<string, unknown>;
}

const notificationService = {
    create: (payload: CreateNotificationRequest) =>
        apiService.post<SuccessResponse<NotificationItem>>('/notifications', payload),
    sendActivityNotification: (activityId: string, payload: SendActivityNotificationRequest) =>
        apiService.post<SuccessResponse<{ recipientCount: number; activityId: string }>>(`/activities/${activityId}/notifications`, payload),
    getById: (id: string) =>
        apiService.get<SuccessResponse<NotificationItem>>(`/notifications/${id}`),
    getNotifications: (params?: NotificationsQuery) =>
        apiService.get<SuccessResponse<NotificationsResponse>>('/notifications', { params }),
    getUnreadCount: () =>
        apiService.get<SuccessResponse<UnreadNotificationsResponse>>('/notifications/unread/count'),
    markAsRead: (id: string) =>
        apiService.patch<SuccessResponse<NotificationItem>>(`/notifications/${id}/read`),
    markAllAsRead: () =>
        apiService.patch<SuccessResponse<{ success: true; message: string }>>('/notifications/mark-all/read'),
};

export default notificationService;