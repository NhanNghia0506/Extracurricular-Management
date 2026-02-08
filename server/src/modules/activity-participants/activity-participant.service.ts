import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { ActivityParticipantRepository } from "./activity-participant.repository";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";
import { ActivityParticipant } from "./activity-participant.entity";
import { Types } from "mongoose";
import { ActivityService } from "../activities/activity.service";

@Injectable()
export class ActivityParticipantService {
    constructor(
        private readonly activityParticipantRepository: ActivityParticipantRepository,
        @Inject(forwardRef(() => ActivityService))
        private readonly activityService: ActivityService,
    ) { }

    // Đăng ký tham gia hoạt động
    async create(activityParticipantData: CreateActivityParticipantDto, userId: string) {
        const activity = await this.activityService.findById(activityParticipantData.activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        const participantQuantity = await this.countParticipantsByActivity(activityParticipantData.activityId);

        // Kiểm tra số lượng đăng ký đã vượt quá giới hạn chưa
        if (activity.participantCount > 0 && participantQuantity >= activity.participantCount) {
            throw new BadRequestException('Số lượng tham gia đã đủ');
        }

        const activityParticipant = {
            activityId: new Types.ObjectId(activityParticipantData.activityId),
            userId: new Types.ObjectId(userId),
            status: activityParticipantData.status,
            approvedBy: activityParticipantData.approvedBy
                ? new Types.ObjectId(activityParticipantData.approvedBy)
                : null,
            approvedAt: activityParticipantData.approvedAt || null,
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
}
