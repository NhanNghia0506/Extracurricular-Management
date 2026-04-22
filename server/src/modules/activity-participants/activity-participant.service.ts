import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException, forwardRef } from "@nestjs/common";
import { ActivityParticipantRepository } from "./activity-participant.repository";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";
import { ActivityParticipant, ParticipantStatus } from "./activity-participant.entity";
import { Types } from "mongoose";
import { ActivityService } from "../activities/activity.service";
import { ActivityApprovalStatus, UserRole, NotificationType, NotificationPriority } from "src/global/globalEnum";
import { NotificationService } from "../notifications/notification.service";
import UserService from "../users/user.service";

interface ActivityParticipantFinalizationRepository {
    findUserIdsWithPerfectAttendance(activityId: string): Promise<string[]>;
    updateStatusesByActivityAndUserIds(
        activityId: string,
        userIds: string[],
        status: ParticipantStatus,
    ): Promise<number>;
}

@Injectable()
export class ActivityParticipantService {
    constructor(
        private readonly activityParticipantRepository: ActivityParticipantRepository,
        @Inject(forwardRef(() => ActivityService))
        private readonly activityService: ActivityService,
        private readonly notificationService: NotificationService,
        private readonly userService: UserService,
    ) { }

    // Đăng ký tham gia hoạt động
    async create(activityParticipantData: CreateActivityParticipantDto, userId: string) {
        if (!Types.ObjectId.isValid(activityParticipantData.activityId)) {
            throw new BadRequestException('activityId không hợp lệ');
        }

        const activity = await this.activityService.findById(activityParticipantData.activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        if (activity.approvalStatus !== ActivityApprovalStatus.APPROVED) {
            throw new ForbiddenException('Hoạt động chưa được duyệt nên chưa thể đăng ký tham gia');
        }

        const existingActiveRegistration = await this.activityParticipantRepository.findActiveByActivityAndUserId(
            activityParticipantData.activityId,
            userId,
        );

        if (existingActiveRegistration) {
            throw new BadRequestException('Bạn đã đăng ký hoạt động này rồi');
        }

        const targetStart = new Date(activity.startAt);
        const targetEnd = activity.endAt ? new Date(activity.endAt) : targetStart;

        const registeredSchedules = await this.activityParticipantRepository.findUserRegisteredActivitySchedules(
            userId,
            activityParticipantData.activityId,
        );

        const conflictingSchedule = registeredSchedules.find((scheduled) => {
            const scheduledStart = new Date(scheduled.startAt);
            const scheduledEnd = scheduled.endAt ? new Date(scheduled.endAt) : scheduledStart;

            return scheduledStart.getTime() <= targetEnd.getTime()
                && targetStart.getTime() <= scheduledEnd.getTime();
        });

        if (conflictingSchedule) {
            const formatDateTime = (value: Date) => value.toLocaleString('vi-VN');
            const conflictStart = new Date(conflictingSchedule.startAt);
            const conflictEnd = conflictingSchedule.endAt ? new Date(conflictingSchedule.endAt) : conflictStart;

            throw new BadRequestException(
                `Lịch bị trùng với hoạt động "${conflictingSchedule.title}" (${formatDateTime(conflictStart)} - ${formatDateTime(conflictEnd)}).`,
            );
        }

        // Count ONLY REGISTERED participants for capacity checking
        const registeredCount = await this.activityParticipantRepository.countRegisteredByActivityId(activityParticipantData.activityId);

        // Determine status: REGISTERED if slot available, PENDING if full
        let status = ParticipantStatus.REGISTERED;
        if (activity.participantCount > 0 && registeredCount >= activity.participantCount) {
            status = ParticipantStatus.PENDING;
        }

        const registeredAt = activityParticipantData.registeredAt || new Date();
        const latestRegistration = await this.activityParticipantRepository.findLatestByActivityAndUserId(
            activityParticipantData.activityId,
            userId,
        );

        if (latestRegistration?.status === ParticipantStatus.CANCELLED) {
            return this.activityParticipantRepository.reactivateRegistration(
                latestRegistration._id.toString(),
                status,
                registeredAt,
            );
        }

        const activityParticipant = {
            activityId: new Types.ObjectId(activityParticipantData.activityId),
            userId: new Types.ObjectId(userId),
            status,
            registeredAt,
        } as ActivityParticipant;

        return this.activityParticipantRepository.create(activityParticipant);
    }

    countParticipantsByActivity(activityId: string) {
        // For UI/statistics: count both current registrations and finalized participations
        return this.activityParticipantRepository.countRegisteredAndParticipatedByActivityId(activityId);
    }

    // Handle capacity check and auto-promotion of PENDING users
    private async handleCapacityAndPromotion(activityId: string): Promise<{ wasPromoted: boolean; promotedUserId?: string; promotedUserName?: string }> {
        try {
            const activity = await this.activityService.findById(activityId);
            if (!activity || activity.participantCount === 0) {
                // Unlimited capacity or activity not found
                return { wasPromoted: false };
            }

            // Count REGISTERED participants
            const registeredCount = await this.activityParticipantRepository.countRegisteredByActivityId(activityId);

            // Check if slot is available and there's someone waiting
            if (registeredCount < activity.participantCount) {
                const nextPending = await this.activityParticipantRepository.findFirstPendingByActivityId(activityId);

                if (nextPending) {
                    const pendingId = String(nextPending._id || '');
                    if (!pendingId) {
                        return { wasPromoted: false };
                    }

                    // Promote PENDING to REGISTERED
                    await this.activityParticipantRepository.updateStatus(
                        pendingId,
                        ParticipantStatus.REGISTERED,
                    );

                    // Get user info for notification
                    const promotedUser = await this.userService.getProfile(nextPending.userId.toString());

                    if (promotedUser) {
                        // Send notification
                        await this.notificationService.create({
                            userId: String(promotedUser.id),
                            senderName: 'Hệ thống',
                            senderType: 'SYSTEM',
                            title: 'Bạn đã được chuyển từ danh sách chờ',
                            message: `Bạn đã được chuyển sang danh sách tham gia cho hoạt động "${activity.title}". Vui lòng kiểm tra chi tiết.`,
                            type: NotificationType.ACTIVITY,
                            priority: NotificationPriority.HIGH,
                            linkUrl: `/activity-detail?id=${activityId}`,
                            meta: {
                                activityId,
                                activityTitle: activity.title,
                                activityDate: activity.startAt,
                            },
                        });
                    }

                    return {
                        wasPromoted: true,
                        promotedUserId: nextPending.userId.toString(),
                        promotedUserName: promotedUser?.name,
                    };
                }
            }

            return { wasPromoted: false };
        } catch (error) {
            // Log error but don't throw - promotion failure shouldn't break cancellation
            console.error('Error during waitlist promotion:', error);
            return { wasPromoted: false, promotedUserName: undefined };
        }
    }

    // Cancel participant registration
    async cancelParticipation(participantId: string, userId: string, userRole: UserRole): Promise<any> {
        if (!Types.ObjectId.isValid(participantId)) {
            throw new BadRequestException('participantId không hợp lệ');
        }

        const participant = await this.activityParticipantRepository.findById(participantId);
        if (!participant) {
            throw new NotFoundException('Không tìm thấy đăng ký tham gia');
        }

        // Permission check: only participant, activity owner, or admin can cancel
        const isParticipant = participant.userId.toString() === userId;
        const isAdmin = userRole === UserRole.ADMIN;
        const activity = await this.activityService.findById(participant.activityId.toString());
        const isActivityOwner = activity?.createdBy?.toString?.() === userId;

        if (!isParticipant && !isAdmin && !isActivityOwner) {
            throw new UnauthorizedException('Bạn không có quyền hủy đăng ký này');
        }

        // Set status to CANCELLED
        await this.activityParticipantRepository.updateStatus(participantId, ParticipantStatus.CANCELLED);

        // Only auto-promote if the cancelled participant was REGISTERED
        let promotionResult: { wasPromoted: boolean; promotedUserId?: string; promotedUserName?: string } = { wasPromoted: false };
        if (participant.status === ParticipantStatus.REGISTERED) {
            promotionResult = await this.handleCapacityAndPromotion(participant.activityId.toString());
        }

        return {
            success: true,
            message: 'Đã hủy đăng ký',
            wasPromoted: promotionResult.wasPromoted,
            promotedUserName: promotionResult.promotedUserName,
        };
    }

    // Lấy danh sách sinh viên đăng kí tham gia hoạt động theo activityId kèm thông tin lớp và khoa, chức năng này chỉ dành cho teacher
    findByActivityIdWithStudentInfo(activityId: string) {
        return this.activityParticipantRepository.findByActivityIdWithClassFacultyNames(activityId);
    }

    // Lấy danh sách thành viên tham gia một hoạt động
    findByActivityId(activityId: string): Promise<ActivityParticipant[]> {
        return this.activityParticipantRepository.findByActivityId(activityId);
    }

    findApprovedByActivityId(activityId: string): Promise<ActivityParticipant[]> {
        return this.activityParticipantRepository.findApprovedByActivityId(activityId);
    }

    findByActivityAndUserId(activityId: string, userId: string): Promise<ActivityParticipant | null> {
        return this.activityParticipantRepository.findByActivityAndUserId(activityId, userId);
    }

    async finalizeParticipationStatuses(activityId: string): Promise<{ eligibleCount: number; updatedCount: number }> {
        const repository = this.activityParticipantRepository as ActivityParticipantFinalizationRepository;
        const eligibleUserIds = await repository.findUserIdsWithPerfectAttendance(activityId);
        const updatedCount = await repository.updateStatusesByActivityAndUserIds(
            activityId,
            eligibleUserIds,
            'PARTICIPATED' as ParticipantStatus,
        );

        return {
            eligibleCount: eligibleUserIds.length,
            updatedCount,
        };
    }

    deleteByActivityId(activityId: string) {
        return this.activityParticipantRepository.deleteByActivityId(activityId);
    }

    // Lấy danh sách hoạt động mà user đã tham gia
    findActivitiesByUserId(userId: string) {
        return this.activityParticipantRepository.findActivitiesByUserId(userId);
    }
}
