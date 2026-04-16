import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ActivityService } from '../activities/activity.service';
import { CreateCheckinSessionDto } from './dtos/create.checkin-session.dto';
import { CheckinSessionRepository } from './checkin-session.repository';
import { CheckinSession } from './checkin-session.entity';
import { UpdateCheckinSessionDto } from './dtos/update.checkin-session.dto';
import { ActivityStatus, NotificationPriority, NotificationType, OrganizerMemberRole, UserRole } from 'src/global/globalEnum';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { NotificationService } from '../notifications/notification.service';
import { OrganizerMemberService } from '../organizer-members/organizer-member.service';

@Injectable()
export class CheckinSessionService {
    private readonly logger = new Logger(CheckinSessionService.name);

    private ensureValidDate(value: Date, fieldName: string): Date {
        const parsed = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            throw new BadRequestException(`${fieldName} không hợp lệ`);
        }

        return parsed;
    }

    private validateSessionWindowWithinActivity(startTime: Date, endTime: Date, activityStartAt: Date, activityEndAt?: Date | null) {
        const normalizedStartTime = this.ensureValidDate(startTime, 'startTime');
        const normalizedEndTime = this.ensureValidDate(endTime, 'endTime');
        const normalizedActivityStartAt = this.ensureValidDate(activityStartAt, 'activity.startAt');
        const normalizedActivityEndAt = activityEndAt ? this.ensureValidDate(activityEndAt, 'activity.endAt') : null;

        if (normalizedStartTime >= normalizedEndTime) {
            throw new BadRequestException('startTime phải nhỏ hơn endTime');
        }

        if (normalizedStartTime < normalizedActivityStartAt) {
            throw new BadRequestException('startTime của phiên điểm danh không được trước thời gian bắt đầu của hoạt động');
        }

        if (normalizedActivityEndAt && normalizedEndTime > normalizedActivityEndAt) {
            throw new BadRequestException('endTime của phiên điểm danh không được sau thời gian kết thúc của hoạt động');
        }
    }

    constructor(
        private readonly checkinSessionRepository: CheckinSessionRepository,
        private readonly activityService: ActivityService,
        private readonly activityParticipantService: ActivityParticipantService,
        private readonly notificationService: NotificationService,
        private readonly organizerMemberService: OrganizerMemberService,
    ) { }

    async create(createCheckinSessionDto: CreateCheckinSessionDto, actorUserId: string) {
        if (!Types.ObjectId.isValid(createCheckinSessionDto.activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityService.findById(createCheckinSessionDto.activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        const organizerId = typeof activity.organizerId === 'string'
            ? activity.organizerId
            : String((activity.organizerId as any)?._id || activity.organizerId || '');

        if (!Types.ObjectId.isValid(organizerId)) {
            throw new BadRequestException('Không xác định được tổ chức của hoạt động');
        }

        const actorMember = await this.organizerMemberService.findByUserIdAndOrganizerId(actorUserId, organizerId);
        if (!actorMember || !actorMember.isActive || actorMember.role !== OrganizerMemberRole.MANAGER) {
            throw new ForbiddenException('Chỉ MANAGER của tổ chức mới có quyền tạo phiên điểm danh');
        }

        if (activity.status === ActivityStatus.COMPLETED) {
            throw new BadRequestException('Không thể tạo phiên điểm danh cho hoạt động đã kết thúc');
        }

        this.validateSessionWindowWithinActivity(
            createCheckinSessionDto.startTime,
            createCheckinSessionDto.endTime,
            activity.startAt,
            activity.endAt,
        );

        if (createCheckinSessionDto.lateAfter !== undefined) {
            if (
                createCheckinSessionDto.lateAfter <= createCheckinSessionDto.startTime ||
                createCheckinSessionDto.lateAfter >= createCheckinSessionDto.endTime
            ) {
                throw new BadRequestException('lateAfter phải nằm trong khoảng giữa startTime và endTime');
            }
        }

        const checkinSession = {
            activityId: new Types.ObjectId(createCheckinSessionDto.activityId),
            title: createCheckinSessionDto.title.trim(),
            location: createCheckinSessionDto.location,
            startTime: createCheckinSessionDto.startTime,
            endTime: createCheckinSessionDto.endTime,
            radiusMetters: createCheckinSessionDto.radiusMetters,
            ...(createCheckinSessionDto.lateAfter !== undefined && { lateAfter: createCheckinSessionDto.lateAfter }),
        };

        const createdSession = await this.checkinSessionRepository.create(checkinSession);

        // Notification errors must not block successful session creation.
        try {
            const participants = await this.activityParticipantService.findApprovedByActivityId(
                createCheckinSessionDto.activityId,
            );
            const targetUserIds = Array.from(
                new Set(
                    participants
                        .map((participant) => participant.userId?.toString())
                        .filter((userId): userId is string => Boolean(userId)),
                ),
            );

            if (targetUserIds.length > 0) {
                await this.notificationService.createBulkNotifications(targetUserIds, {
                    senderName: 'Hệ thống',
                    senderType: 'system',
                    title: 'Điểm danh đã mở',
                    message: `Phiên điểm danh "${createdSession.title}" của hoạt động "${activity.title}" đã mở.`,
                    type: NotificationType.ACTIVITY,
                    priority: NotificationPriority.HIGH,
                    linkUrl: `/activity-detail?id=${createCheckinSessionDto.activityId}`,
                    groupKey: `checkin-opened:${createdSession._id.toString()}`,
                    meta: {
                        activityId: createCheckinSessionDto.activityId,
                        checkinSessionId: createdSession._id.toString(),
                        checkinSessionTitle: createdSession.title,
                        startTime: createdSession.startTime,
                        endTime: createdSession.endTime,
                    },
                });
            }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Không thể gửi thông báo mở điểm danh cho session ${createdSession._id.toString()}: ${reason}`);
        }

        return createdSession;
    }

    async update(
        sessionId: string,
        updateCheckinSessionDto: UpdateCheckinSessionDto,
        actorUserId: string,
        actorRole?: string,
    ) {
        const existingSession = await this.findById(sessionId);
        if (!existingSession) {
            throw new NotFoundException('Không tìm thấy phiên điểm danh với ID đã cho');
        }

        const activity = await this.activityService.findById(existingSession.activityId.toString());
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động của phiên điểm danh');
        }

        const isOwner = activity.createdBy?.toString() === actorUserId;
        const isAdmin = actorRole === UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Chỉ chủ hoạt động hoặc admin mới có quyền chỉnh sửa phiên điểm danh');
        }

        this.validateSessionWindowWithinActivity(
            updateCheckinSessionDto.startTime,
            updateCheckinSessionDto.endTime,
            activity.startAt,
            activity.endAt,
        );

        if (!Number.isFinite(updateCheckinSessionDto.radiusMetters) || updateCheckinSessionDto.radiusMetters <= 0) {
            throw new BadRequestException('radiusMetters phải lớn hơn 0');
        }

        if (updateCheckinSessionDto.lateAfter !== undefined) {
            if (
                updateCheckinSessionDto.lateAfter !== null &&
                (
                    updateCheckinSessionDto.lateAfter <= updateCheckinSessionDto.startTime ||
                    updateCheckinSessionDto.lateAfter >= updateCheckinSessionDto.endTime
                )
            ) {
                throw new BadRequestException('lateAfter phải nằm trong khoảng giữa startTime và endTime');
            }
        }

        const updated = await this.checkinSessionRepository.updateById(sessionId, {
            title: updateCheckinSessionDto.title.trim(),
            location: updateCheckinSessionDto.location,
            startTime: updateCheckinSessionDto.startTime,
            endTime: updateCheckinSessionDto.endTime,
            radiusMetters: updateCheckinSessionDto.radiusMetters,
            ...(updateCheckinSessionDto.lateAfter !== undefined && { lateAfter: updateCheckinSessionDto.lateAfter }),
        });

        if (!updated) {
            throw new NotFoundException('Không tìm thấy phiên điểm danh với ID đã cho');
        }

        return updated;
    }

    findById(id: string): Promise<CheckinSession | null> {
        return this.checkinSessionRepository.findById(id);
    }

    async findActivityBySessionId(sessionId: string) {
        const session = await this.findById(sessionId);
        if (!session) {
            return null;
        }

        return this.activityService.findById(session.activityId.toString());
    }

    async findByActivityId(activityId: string): Promise<CheckinSession | null> {
        if (!Types.ObjectId.isValid(activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        return this.checkinSessionRepository.findByActivityId(activityId);
    }

    async findAllByActivityId(activityId: string): Promise<CheckinSession[]> {
        if (!Types.ObjectId.isValid(activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        return this.checkinSessionRepository.findAllByActivityId(activityId);
    }

    findIdsByActivityIds(activityIds: string[]): Promise<string[]> {
        return this.checkinSessionRepository.findIdsByActivityIds(activityIds);
    }
}
