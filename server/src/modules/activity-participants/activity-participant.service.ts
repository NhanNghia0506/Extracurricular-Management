import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { ActivityParticipantRepository } from "./activity-participant.repository";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";
import { ActivityParticipant, ParticipantStatus } from "./activity-participant.entity";
import { Types } from "mongoose";
import { ActivityService } from "../activities/activity.service";
import { ActivityApprovalStatus } from "src/global/globalEnum";

@Injectable()
export class ActivityParticipantService {
    constructor(
        private readonly activityParticipantRepository: ActivityParticipantRepository,
        @Inject(forwardRef(() => ActivityService))
        private readonly activityService: ActivityService,
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

        const existingRegistration = await this.activityParticipantRepository.findByActivityAndUserId(
            activityParticipantData.activityId,
            userId,
        );

        if (existingRegistration && existingRegistration.status !== ParticipantStatus.CANCELLED) {
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

        const participantQuantity = await this.countParticipantsByActivity(activityParticipantData.activityId);

        // Kiểm tra số lượng đăng ký đã vượt quá giới hạn chưa
        if (activity.participantCount > 0 && participantQuantity >= activity.participantCount) {
            throw new BadRequestException('Số lượng tham gia đã đủ');
        }

        const activityParticipant = {
            activityId: new Types.ObjectId(activityParticipantData.activityId),
            userId: new Types.ObjectId(userId),
            status: ParticipantStatus.REGISTERED,
            registeredAt: activityParticipantData.registeredAt || new Date(),
        } as ActivityParticipant;

        return this.activityParticipantRepository.create(activityParticipant);
    }

    countParticipantsByActivity(activityId: string) {
        return this.activityParticipantRepository.countByActivityId(activityId);
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

    deleteByActivityId(activityId: string) {
        return this.activityParticipantRepository.deleteByActivityId(activityId);
    }

    // Lấy danh sách hoạt động mà user đã tham gia
    findActivitiesByUserId(userId: string) {
        return this.activityParticipantRepository.findActivitiesByUserId(userId);
    }
}
