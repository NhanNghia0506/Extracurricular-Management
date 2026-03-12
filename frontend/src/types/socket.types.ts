import type { NotificationItem } from './notification.types';

export interface MessageData {
    text: string;
    userId?: string;
    timestamp?: number;
}

export interface ConversationRoomPayload {
    conversationId: string;
}

export interface ConversationUpdatedPayload {
    _id: string;
    title: string;
    participantsCount: number;
    lastMessageAt?: string;
    lastMessageContent?: string;
    lastMessageUserName?: string;
    activityImage?: string;
}

export interface ConversationOnlineCountPayload {
    conversationId: string;
    onlineCount: number;
}

export interface NotificationRealtimePayload {
    notification: NotificationItem;
    unreadCount: number;
}

export interface NotificationUnreadCountPayload {
    unreadCount: number;
}

export interface NotificationReadPayload {
    notificationId: string;
    unreadCount: number;
}

export interface NotificationDeletedPayload extends NotificationReadPayload {
    type?: string;
    senderType?: string;
}

export interface WelcomeData {
    message: string;
    clientId: string;
}

export interface MessageResponse {
    status: 'ok' | 'error';
    message: string;
    data?: MessageData;
}

// Socket Events
export enum SocketEvent {
    // Client to Server
    SEND_MESSAGE = 'send-message',
    JOIN_CONVERSATION = 'join-conversation',
    LEAVE_CONVERSATION = 'leave-conversation',
    NOTIFICATIONS_SUBSCRIBE = 'notifications:subscribe',

    // Server to Client
    RECEIVE_MESSAGE = 'receive-message',
    CONVERSATION_MESSAGE_NEW = 'conversation:message:new',
    CONVERSATION_UPDATED = 'conversation:updated',
    CONVERSATION_ONLINE_COUNT = 'conversation:online-count',
    NOTIFICATION_NEW = 'notification:new',
    NOTIFICATION_READ = 'notification:read',
    NOTIFICATION_ALL_READ = 'notification:all-read',
    NOTIFICATION_DELETED = 'notification:deleted',
    NOTIFICATION_UNREAD_COUNT = 'notification:unread-count',
    WELCOME = 'welcome',

    // Connection events
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    CONNECT_ERROR = 'connect_error',
    RECONNECT = 'reconnect',
    RECONNECT_ERROR = 'reconnect_error',
    RECONNECT_FAILED = 'reconnect_failed',
}
