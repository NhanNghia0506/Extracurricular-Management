import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivityRepository } from './activity.repository';
import { CreateActivityDto } from './dtos/create.activity.dto';
import { Types } from 'mongoose';
import { ActivityStatus } from '../../global/globalEnum';
import { Activity } from './activity.entity';
import { ActivityDetailResponse } from 'src/global/globalInterface';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';


@Injectable()
export class ActivityService {
    constructor(
        private readonly activityRepository: ActivityRepository,
        private readonly activityParticipantService: ActivityParticipantService,
    ) { }

    /**
     * Tạo activity mới
     * @param createActivityDto - DTO chứa thông tin activity
     * @returns Activity đã được tạo
     */
    async create(createActivityDto: CreateActivityDto): Promise<Activity> {
        if (
            !Types.ObjectId.isValid(createActivityDto.organizerId) ||
            !Types.ObjectId.isValid(createActivityDto.categoryId)
        ) {
            throw new BadRequestException(
                'organizerId và categoryId phải là MongoDB ObjectId hợp lệ',
            );
        }

        if (!createActivityDto.location) {
            throw new BadRequestException('location là bắt buộc');
        }

        // Tạo entity
        const activity = {
            title: createActivityDto.title,
            description: createActivityDto.description,
            location: createActivityDto.location,
            status: createActivityDto.status || ActivityStatus.OPEN,
            startAt: createActivityDto.startAt,
            endAt: createActivityDto.endAt,
            trainingScore: createActivityDto.trainingScore,
            participantCount: createActivityDto.participantCount,
            image: createActivityDto.image, // Tên file đã upload
            organizerId: new Types.ObjectId(createActivityDto.organizerId),
            categoryId: new Types.ObjectId(createActivityDto.categoryId),
        };

        // Lưu vào database
        const result = await this.activityRepository.create(activity);
        return result;
    }

    /**
     * Lấy danh sách activities
     * @returns Danh sách Activity
     */
    async findAll(): Promise<Activity[]> {
        return this.activityRepository.findAll();
    }

    /**
     * Lấy chi tiết activity theo ID
     * @param id - ID của activity
     * @returns Chi tiết Activity
     */
    async findActivityDetailById(id: string): Promise<ActivityDetailResponse | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        const participantCount = await this.activityParticipantService.countParticipantsByActivity(id);

        return {
            id: activity._id.toString(),
            title: activity.title,
            description: activity.description,
            startAt: activity.startAt,
            endAt: activity.endAt,
            location: activity.location,
            status: activity.status,
            image: activity.image,
            trainingScore: activity.trainingScore,
            participantCount: activity.participantCount,
            organizer: activity.organizerId,
            category: activity.categoryId,
            registeredCount: participantCount,
        } as ActivityDetailResponse;
    }
}
