import type {
    NotificationDeletedPayload,
    NotificationReadPayload,
    NotificationRealtimePayload,
    NotificationUnreadCountPayload,
} from '../types/socket.types';

export const NOTIFICATION_NEW_EVENT = 'app:notification:new';
export const NOTIFICATION_READ_EVENT = 'app:notification:read';
export const NOTIFICATION_ALL_READ_EVENT = 'app:notification:all-read';
export const NOTIFICATION_DELETED_EVENT = 'app:notification:deleted';
export const NOTIFICATION_UNREAD_COUNT_EVENT = 'app:notification:unread-count';

export const dispatchNotificationNew = (payload: NotificationRealtimePayload) => {
    window.dispatchEvent(new CustomEvent<NotificationRealtimePayload>(NOTIFICATION_NEW_EVENT, { detail: payload }));
};

export const dispatchNotificationRead = (payload: NotificationReadPayload) => {
    window.dispatchEvent(new CustomEvent<NotificationReadPayload>(NOTIFICATION_READ_EVENT, { detail: payload }));
};

export const dispatchNotificationAllRead = (payload: NotificationUnreadCountPayload) => {
    window.dispatchEvent(new CustomEvent<NotificationUnreadCountPayload>(NOTIFICATION_ALL_READ_EVENT, { detail: payload }));
};

export const dispatchNotificationDeleted = (payload: NotificationDeletedPayload) => {
    window.dispatchEvent(new CustomEvent<NotificationDeletedPayload>(NOTIFICATION_DELETED_EVENT, { detail: payload }));
};

export const dispatchNotificationUnreadCount = (payload: NotificationUnreadCountPayload) => {
    window.dispatchEvent(new CustomEvent<NotificationUnreadCountPayload>(NOTIFICATION_UNREAD_COUNT_EVENT, { detail: payload }));
};