import type { NotificationItem } from '../types/notification.types';

export const getNotificationNavigationTarget = (notification: NotificationItem): string => {
    if (notification.type === 'ACTIVITY') {
        return `/notification-detail?id=${notification._id}`;
    }

    return notification.linkUrl || `/notification-detail?id=${notification._id}`;
};