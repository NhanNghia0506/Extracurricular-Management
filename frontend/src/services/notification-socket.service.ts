import { io, Socket } from 'socket.io-client';
import authService from './auth.service';

class NotificationSocketService {
    private socket: Socket | null = null;

    connect(): Socket | null {
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.id) {
            return null;
        }

        if (this.socket) {
            return this.socket;
        }

        const baseUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
        this.socket = io(`${baseUrl.replace(/\/$/, '')}/notifications`, {
            transports: ['websocket'],
            withCredentials: true,
            auth: {
                userId: currentUser.id,
                token: authService.getToken(),
            },
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }
}

export const notificationSocketService = new NotificationSocketService();