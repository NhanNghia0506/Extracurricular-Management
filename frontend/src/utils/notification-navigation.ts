import type { NotificationItem } from '../types/notification.types';

export const getNotificationNavigationTarget = (notification: NotificationItem): string => {
    return `/notification-detail?id=${notification._id}`;
};