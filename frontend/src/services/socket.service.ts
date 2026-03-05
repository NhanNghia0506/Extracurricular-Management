import { io, Socket } from "socket.io-client";

class SocketService {
    private socket: Socket | null = null;
    private isConnecting: boolean = false;

    connect(namespace?: string): Socket {
        const baseUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
        const normalizedNamespace = namespace?.replace(/^\//, '');
        const socketUrl = normalizedNamespace
            ? `${baseUrl.replace(/\/$/, '')}/${normalizedNamespace}`
            : baseUrl;

        // Nếu socket đã connected, return nó
        if (this.socket?.connected) {
            return this.socket;
        }

        // Nếu socket connect tới URL khác, disconnect cái cũ
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        if (this.isConnecting && this.socket) {
            return this.socket;
        }

        this.isConnecting = true;

        this.socket = io(socketUrl, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            this.isConnecting = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
            this.isConnecting = false;
        });

        this.socket.on('disconnect', () => {
            this.isConnecting = false;
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ WebSocket reconnection error:', error.message);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ WebSocket reconnection failed');
        });

        return this.socket;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.isConnecting = false;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    emit(event: string, data: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('⚠️ Cannot emit - Socket not connected. Event:', event, 'Data:', data);
        }
    }

    on(event: string, callback: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.on(event, (...args) => {
                callback(...args);
            });
        }
    }

    off(event: string, callback?: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();