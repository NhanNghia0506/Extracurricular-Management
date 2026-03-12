import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastActions } from '../../contexts/ToastContext';
import { notificationSocketService } from '../../services/notification-socket.service';
import { SocketEvent } from '../../types/socket.types';
import type {
    NotificationDeletedPayload,
    NotificationReadPayload,
    NotificationRealtimePayload,
    NotificationUnreadCountPayload,
} from '../../types/socket.types';
import {
    dispatchNotificationAllRead,
    dispatchNotificationDeleted,
    dispatchNotificationNew,
    dispatchNotificationRead,
    dispatchNotificationUnreadCount,
} from '../../utils/notification-realtime';
import authService from '../../services/auth.service';
import { getNotificationNavigationTarget } from '../../utils/notification-navigation';

const NotificationRealtimeBridge: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToastActions();

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.id) {
            return;
        }

        const socket = notificationSocketService.connect();
        if (!socket) {
            return;
        }

        const handleNew = (payload: NotificationRealtimePayload) => {
            dispatchNotificationNew(payload);
            dispatchNotificationUnreadCount({ unreadCount: payload.unreadCount });

            const nextNotification = payload.notification;
            const navigationTarget = getNotificationNavigationTarget(nextNotification);

            showToast({
                type: 'info',
                title: nextNotification.title || 'Thông báo mới',
                message: nextNotification.message || 'Bạn có một thông báo mới.',
                actionText: 'Xem ngay',
                onAction: () => navigate(navigationTarget),
            });
        };

        const handleRead = (payload: NotificationReadPayload) => {
            dispatchNotificationRead(payload);
            dispatchNotificationUnreadCount({ unreadCount: payload.unreadCount });
        };

        const handleAllRead = (payload: NotificationUnreadCountPayload) => {
            dispatchNotificationAllRead(payload);
            dispatchNotificationUnreadCount(payload);
        };

        const handleDeleted = (payload: NotificationDeletedPayload) => {
            dispatchNotificationDeleted(payload);
            dispatchNotificationUnreadCount({ unreadCount: payload.unreadCount });
        };

        const handleUnreadCount = (payload: NotificationUnreadCountPayload) => {
            dispatchNotificationUnreadCount(payload);
        };

        socket.on(SocketEvent.NOTIFICATION_NEW, handleNew);
        socket.on(SocketEvent.NOTIFICATION_READ, handleRead);
        socket.on(SocketEvent.NOTIFICATION_ALL_READ, handleAllRead);
        socket.on(SocketEvent.NOTIFICATION_DELETED, handleDeleted);
        socket.on(SocketEvent.NOTIFICATION_UNREAD_COUNT, handleUnreadCount);

        return () => {
            socket.off(SocketEvent.NOTIFICATION_NEW, handleNew);
            socket.off(SocketEvent.NOTIFICATION_READ, handleRead);
            socket.off(SocketEvent.NOTIFICATION_ALL_READ, handleAllRead);
            socket.off(SocketEvent.NOTIFICATION_DELETED, handleDeleted);
            socket.off(SocketEvent.NOTIFICATION_UNREAD_COUNT, handleUnreadCount);
            notificationSocketService.disconnect();
        };
    }, [navigate, showToast]);

    return null;
};

export default NotificationRealtimeBridge;