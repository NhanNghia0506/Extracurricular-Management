import { Logger } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface NotificationRoomPayload {
	userId: string;
}

interface NotificationRealtimePayload {
	notification: Record<string, unknown>;
	unreadCount: number;
}

interface NotificationStatePayload {
	notificationId: string;
	unreadCount: number;
}

interface NotificationDeletedPayload extends NotificationStatePayload {
	type?: string;
	senderType?: string;
}

@WebSocketGateway({
	namespace: 'notifications',
	cors: {
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	},
	transports: ['websocket'],
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(NotificationGateway.name);

	private getUserRoom(userId: string) {
		return `user:${userId}`;
	}

	private normalizeHandshakeUserId(value: unknown): string | null {
		if (typeof value === 'string') {
			const normalizedValue = value.trim();
			return normalizedValue || null;
		}

		if (Array.isArray(value)) {
			const firstStringValue = value.find((item): item is string => typeof item === 'string');
			return firstStringValue ? this.normalizeHandshakeUserId(firstStringValue) : null;
		}

		return null;
	}

	private tryGetHandshakeUserId(client: Socket): string | null {
		const auth = client.handshake.auth as Record<string, unknown> | undefined;
		const query = client.handshake.query as Record<string, unknown> | undefined;
		return this.normalizeHandshakeUserId(auth?.userId) ?? this.normalizeHandshakeUserId(query?.userId);
	}

	async handleConnection(client: Socket) {
		const userId = this.tryGetHandshakeUserId(client);

		if (userId) {
			await client.join(this.getUserRoom(userId));
			this.logger.log(`Notification client ${client.id} joined room ${this.getUserRoom(userId)}`);
		} else {
			this.logger.warn(`Notification client ${client.id} connected without userId`);
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Notification client disconnected: ${client.id}`);
	}

	@SubscribeMessage('notifications:subscribe')
	async subscribeToNotifications(
		@MessageBody() payload: NotificationRoomPayload,
		@ConnectedSocket() client: Socket,
	) {
		const userId = payload?.userId?.trim();

		if (!userId) {
			return {
				status: 'error',
				message: 'userId is required',
			};
		}

		const room = this.getUserRoom(userId);
		await client.join(room);

		return {
			status: 'ok',
			room,
		};
	}

	emitNotificationCreated(userId: string, notification: Record<string, unknown>, unreadCount: number) {
		const payload: NotificationRealtimePayload = { notification, unreadCount };
		this.server.to(this.getUserRoom(userId)).emit('notification:new', payload);
		this.server.to(this.getUserRoom(userId)).emit('notification:unread-count', { unreadCount });
	}

	emitNotificationRead(userId: string, notificationId: string, unreadCount: number) {
		const payload: NotificationStatePayload = { notificationId, unreadCount };
		this.server.to(this.getUserRoom(userId)).emit('notification:read', payload);
		this.server.to(this.getUserRoom(userId)).emit('notification:unread-count', { unreadCount });
	}

	emitAllNotificationsRead(userId: string) {
		this.server.to(this.getUserRoom(userId)).emit('notification:all-read', { unreadCount: 0 });
		this.server.to(this.getUserRoom(userId)).emit('notification:unread-count', { unreadCount: 0 });
	}

	emitNotificationDeleted(userId: string, notificationId: string, unreadCount: number, type?: string, senderType?: string) {
		const payload: NotificationDeletedPayload = { notificationId, unreadCount, type, senderType };
		this.server.to(this.getUserRoom(userId)).emit('notification:deleted', payload);
		this.server.to(this.getUserRoom(userId)).emit('notification:unread-count', { unreadCount });
	}
}
