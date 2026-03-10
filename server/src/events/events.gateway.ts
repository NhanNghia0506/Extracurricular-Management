import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface MessageData {
    text: string;
    userId?: string;
    timestamp?: number;
}

interface ConversationRoomPayload {
    conversationId: string;
}

interface ConversationOnlineCountPayload {
    conversationId: string;
    onlineCount: number;
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

    private getConversationRoom(conversationId: string) {
        return `conversation:${conversationId}`;
    }

    private getConversationIdFromRoom(room: string) {
        return room.replace('conversation:', '');
    }

    private async emitConversationOnlineCount(conversationId: string) {
        const room = this.getConversationRoom(conversationId);
        const sockets = await this.server.in(room).fetchSockets();
        const payload: ConversationOnlineCountPayload = {
            conversationId,
            onlineCount: sockets.length,
        };

        this.server.to(room).emit('conversation:online-count', payload);
        return payload;
    }

    handleConnection(client: Socket) {
        this.connectedClients.set(client.id, client);
        this.logger.log(`✅ Client connected: ${client.id} (Total: ${this.connectedClients.size})`);

        client.on('disconnecting', () => {
            const joinedConversationRooms = Array.from(client.rooms).filter((room) => room.startsWith('conversation:'));

            joinedConversationRooms.forEach((room) => {
                const conversationId = this.getConversationIdFromRoom(room);
                setTimeout(() => {
                    this.emitConversationOnlineCount(conversationId).catch((error) => {
                        this.logger.error(`Failed to emit online count for ${conversationId}:`, error);
                    });
                }, 0);
            });
        });

        client.emit('welcome', {
            message: 'Connected to WebSocket server',
            clientId: client.id,
        });
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id);
        this.logger.log(`❌ Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`);
    }

    @SubscribeMessage('join-conversation')
    async joinConversation(
        @MessageBody() payload: ConversationRoomPayload,
        @ConnectedSocket() client: Socket,
    ) {
        const conversationId = payload?.conversationId?.trim();

        if (!conversationId) {
            return {
                status: 'error',
                message: 'conversationId is required',
            };
        }

        const room = this.getConversationRoom(conversationId);
        await client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        const onlinePayload = await this.emitConversationOnlineCount(conversationId);

        return {
            status: 'ok',
            room,
            data: onlinePayload,
        };
    }

    @SubscribeMessage('leave-conversation')
    async leaveConversation(
        @MessageBody() payload: ConversationRoomPayload,
        @ConnectedSocket() client: Socket,
    ) {
        const conversationId = payload?.conversationId?.trim();

        if (!conversationId) {
            return {
                status: 'error',
                message: 'conversationId is required',
            };
        }

        const room = this.getConversationRoom(conversationId);
        await client.leave(room);
        this.logger.log(`Client ${client.id} left room ${room}`);
        await this.emitConversationOnlineCount(conversationId);

        return {
            status: 'ok',
            room,
        };
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

    emitConversationMessage(message: any) {
        const conversationId = String(message?.conversationId || '');

        if (!conversationId) {
            this.logger.warn('Skipping conversation message emit because conversationId is missing');
            return;
        }

        this.server
            .to(this.getConversationRoom(conversationId))
            .emit('conversation:message:new', message);
    }

    emitConversationUpdated(conversation: any) {
        if (!conversation?._id) {
            return;
        }

        this.server.emit('conversation:updated', conversation);
    }

    async getConversationOnlineCount(conversationId: string) {
        const payload = await this.emitConversationOnlineCount(conversationId);
        return payload.onlineCount;
    }

    broadcastToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    sendToClient(clientId: string, event: string, data: any) {
        const client = this.connectedClients.get(clientId);
        if (client) {
            client.emit(event, data);
            return true;
        }
        return false;
    }
}