import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface ActivityCommentsRoomPayload {
    activityId: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    transports: ['websocket'],
})
export class CommentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CommentGateway.name);

    private getActivityCommentsRoom(activityId: string) {
        return `activity:comments:${activityId}`;
    }

    private normalizeActivityId(value: unknown): string {
        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number') {
            return String(value);
        }

        if (value && typeof value === 'object' && 'toString' in value) {
            return String((value as { toString: () => string }).toString());
        }

        return '';
    }

    handleConnection(client: Socket) {
        this.logger.log(`✅ Comment socket connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`❌ Comment socket disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-activity-comments')
    async joinActivityComments(
        @MessageBody() payload: ActivityCommentsRoomPayload,
        @ConnectedSocket() client: Socket,
    ) {
        const activityId = payload?.activityId?.trim();

        if (!activityId) {
            return {
                status: 'error',
                message: 'activityId is required',
            };
        }

        const room = this.getActivityCommentsRoom(activityId);
        await client.join(room);

        return {
            status: 'ok',
            room,
        };
    }

    @SubscribeMessage('leave-activity-comments')
    async leaveActivityComments(
        @MessageBody() payload: ActivityCommentsRoomPayload,
        @ConnectedSocket() client: Socket,
    ) {
        const activityId = payload?.activityId?.trim();

        if (!activityId) {
            return {
                status: 'error',
                message: 'activityId is required',
            };
        }

        const room = this.getActivityCommentsRoom(activityId);
        await client.leave(room);

        return {
            status: 'ok',
            room,
        };
    }

    emitCommentCreated(comment: unknown) {
        const payload = typeof comment === 'object' && comment !== null
            ? comment as { activityId?: unknown }
            : {};
        const activityId = this.normalizeActivityId(payload.activityId);
        if (!activityId) {
            return;
        }

        this.server
            .to(this.getActivityCommentsRoom(activityId))
            .emit('activity:comment:created', comment);
    }

    emitCommentUpdated(comment: unknown) {
        const payload = typeof comment === 'object' && comment !== null
            ? comment as { activityId?: unknown }
            : {};
        const activityId = this.normalizeActivityId(payload.activityId);
        if (!activityId) {
            return;
        }

        this.server
            .to(this.getActivityCommentsRoom(activityId))
            .emit('activity:comment:updated', comment);
    }

    emitCommentDeleted(
        activityId: string,
        payload: { deletedCommentIds: string[]; deletedCount: number },
    ) {
        this.server
            .to(this.getActivityCommentsRoom(activityId))
            .emit('activity:comment:deleted', payload);
    }
}
