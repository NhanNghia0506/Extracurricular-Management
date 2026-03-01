import { io, Socket } from "socket.io-client";

class SocketService {
    private socket: Socket | null = null;
    private isConnecting: boolean = false;

    connect(): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        if (this.isConnecting) {
            return this.socket!;
        }

        this.isConnecting = true;

        this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket?.id);
            this.isConnecting = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
            this.isConnecting = false;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('⚠️ WebSocket disconnected:', reason);
            this.isConnecting = false;
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
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
            console.log('WebSocket disconnected manually');
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    emit(event: string, data: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Cannot emit: Socket is not connected');
        }
    }

    on(event: string, callback: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
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