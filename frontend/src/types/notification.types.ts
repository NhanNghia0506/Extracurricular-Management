export type NotificationType = 'OFFICE' | 'CLASS' | 'ALERT' | 'EVENT' | 'ACTIVITY' | 'SYSTEM';
export type NotificationPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationItem {
    _id: string;
    userId: string;
    senderName: string;
    senderType?: string;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    isRead: boolean;
    readAt?: string;
    linkUrl?: string;
    groupKey?: string;
    meta?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNotificationRequest {
    userId: string;
    senderName: string;
    senderType?: string;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    linkUrl?: string;
    groupKey?: string;
    meta?: Record<string, unknown>;
}

export interface NotificationsResponse {
    notifications: NotificationItem[];
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
}

export interface NotificationsQuery {
    limit?: number;
    skip?: number;
    isRead?: boolean;
    type?: NotificationType;
    senderType?: string;
}

export interface UnreadNotificationsResponse {
    unreadCount: number;
}