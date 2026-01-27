import { Injectable, BadRequestException } from '@nestjs/common';
import { ActivityRepository } from './activity.repository';
import { CreateActivityDto } from './dtos/create.activity.dto';
import { Types } from 'mongoose';
import { ActivityStatus } from '../../global/globalEnum';
import { Activity } from './activity.entity';


@Injectable()
export class ActivityService {
    constructor(
        private readonly activityRepository: ActivityRepository,
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

            // Tạo entity
        const activity = {
            title: createActivityDto.title,
            description: createActivityDto.description,
            location: createActivityDto.location,
            status: createActivityDto.status || ActivityStatus.OPEN,
            startAt: createActivityDto.startAt,
            image: createActivityDto.image, // Tên file đã upload
            organizerId: new Types.ObjectId(createActivityDto.organizerId),
            categoryId: new Types.ObjectId(createActivityDto.categoryId),
        };

        // Lưu vào database
        const result = await this.activityRepository.create(activity);
        return result;
    }
}
