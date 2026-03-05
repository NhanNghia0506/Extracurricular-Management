import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { StudentProfile } from "src/global/globalInterface";
import { Checkin } from "src/modules/checkins/checkin.entity";

interface CheckinEventData {
    checkin: Checkin;
    student: StudentProfile;
    // stats: SessionStats;
}

interface SessionStats {
    totalCheckedIn: number;
    successCount: number;
    failedCount: number;
    percentage: number;
    recentCheckins: any[];
    velocityData: VelocityPoint[];
}

interface VelocityPoint {
    timestamp: Date;
    count: number;
}

@WebSocketGateway({
    namespace: 'checking',
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
    }
})
export class CheckinGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CheckinGateway.name);
    private sessionRooms = new Map<string, Set<string>>(); // sessionId -> Set of clientIds

    handleConnection(client: Socket) {
        this.logger.log(`Client connected to CheckinGateway: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected from CheckinGateway: ${client.id}`);
        // Remove client from any session rooms they were in
        for (const [sessionId, clientIds] of this.sessionRooms.entries()) {
            clientIds.delete(client.id);
            if (clientIds.size === 0) {
                this.sessionRooms.delete(sessionId);
            }
        }
    }

    // Client join để theo dõi một session cụ thể
    @SubscribeMessage('join-session')
    async handleJoinSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string },
    ) {
        const room = `session-${data.sessionId}`;
        await client.join(room);

        if(!this.sessionRooms.has(data.sessionId)) {
            this.sessionRooms.set(data.sessionId, new Set());
        }

        this.sessionRooms.get(data.sessionId)?.add(client.id);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        
        return {
            status: 'ok',
            message: `Joined session ${data.sessionId}`,
            viewers: this.sessionRooms.get(data.sessionId)?.size,
        }
    }

    @SubscribeMessage('leave-session')
    async handleLeaveSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string },
    ){
        const room = `session-${data.sessionId}`;
        await client.leave(room);

        const clients = this.sessionRooms.get(data.sessionId);
        if(clients) {
            clients.delete(client.id);
            if(clients.size === 0) {
                this.sessionRooms.delete(data.sessionId);
            }
        }

        this.logger.log(`Client ${client.id} left room ${room}`);
        return { status: 'ok' };
    }

    // Method để emit khi có checkin mới ( server gửi dữ liệu lên client )
    emitNewCheckin(data: CheckinEventData) {
        const room = `session-${data.checkin.checkinSessionId.toString()}`;
        this.server.to(room).emit('checkin:new', {
            checkin: data.checkin,
            student: data.student,
            timestamp: new Date(),
        });

        this.logger.log(
            `New checkin emitted to session ${data.checkin.checkinSessionId.toString()}`,
        );
    }

    // Emit stats update
    emitStatsUpdate(sessionId: string, stats: SessionStats) {
        const room = `session-${sessionId}`;
        this.server.to(room).emit('checkin:stats', stats);
    }

    // Emit velocity data (checkin speed)
    emitVelocityUpdate(sessionId: string, velocityData: VelocityPoint[]) {
        const room = `session-${sessionId}`;
        this.server.to(room).emit('checkin:velocity', velocityData);
    }

    // Emit session status changes
    emitSessionStarted(sessionId: string, sessionData: any) {
        const room = `session-${sessionId}`;
        this.server.to(room).emit('session:started', sessionData);
    }

    emitSessionEndingSoon(sessionId: string, minutesLeft: number) {
        const room = `session-${sessionId}`;
        this.server.to(room).emit('session:ending-soon', { minutesLeft });
    }

    emitSessionEnded(sessionId: string) {
        const room = `session-${sessionId}`;
        this.server.to(room).emit('session:ended', { sessionId });
    }

    // Get số lượng viewers đang xem session
    getSessionViewers(sessionId: string): number {
        return this.sessionRooms.get(sessionId)?.size || 0;
    }
}