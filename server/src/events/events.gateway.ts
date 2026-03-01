import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

interface MessageData {
    text: string;
    userId?: string;
    timestamp?: number;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    transports: ['websocket'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);
    private connectedClients = new Map<string, Socket>();

    handleConnection(client: Socket) {
        // TODO: Xác thực người dùng từ token
        // const token = client.handshake.auth.token || client.handshake.headers.authorization;
        // if (!token) {
        //     this.logger.warn(`Client ${client.id} rejected: No token provided`);
        //     client.disconnect();
        //     return;
        // }

        this.connectedClients.set(client.id, client);
        this.logger.log(`✅ Client connected: ${client.id} (Total: ${this.connectedClients.size})`);

        // Gửi thông báo chào mừng
        client.emit('welcome', {
            message: 'Connected to WebSocket server',
            clientId: client.id,
        });
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id);
        this.logger.log(`❌ Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`);
    }

    @SubscribeMessage('send-message')
    handleMessage(
        @MessageBody() data: MessageData,
        @ConnectedSocket() client: Socket
    ) {
        try {
            // Validate dữ liệu
            if (!data || typeof data !== 'object') {
                this.logger.warn(`Invalid data from client ${client.id}`);
                return {
                    status: 'error',
                    message: 'Invalid data format',
                };
            }

            if (!data.text || typeof data.text !== 'string' || data.text.trim() === '') {
                this.logger.warn(`Empty message from client ${client.id}`);
                return {
                    status: 'error',
                    message: 'Message text is required',
                };
            }

            // Thêm timestamp nếu chưa có
            const messageData: MessageData = {
                ...data,
                timestamp: data.timestamp || Date.now(),
            };

            this.logger.log(`📩 Message from ${client.id}: ${messageData.text}`);

            // Broadcast tới tất cả clients khác
            client.broadcast.emit('receive-message', messageData);

            return {
                status: 'ok',
                message: 'Message sent successfully',
                data: messageData,
            };
        } catch (error) {
            this.logger.error(`Error handling message from ${client.id}:`, error);
            return {
                status: 'error',
                message: 'Error processing message',
            };
        }
    }

    // Helper method để broadcast tới tất cả clients
    broadcastToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    // Helper method để gửi tới một client cụ thể
    sendToClient(clientId: string, event: string, data: any) {
        const client = this.connectedClients.get(clientId);
        if (client) {
            client.emit(event, data);
            return true;
        }
        return false;
    }
}