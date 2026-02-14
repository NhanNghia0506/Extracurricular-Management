import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ActivityService } from '../activities/activity.service';
import { CreateCheckinSessionDto } from './dtos/create.checkin-session.dto';
import { CheckinSessionRepository } from './checkin-session.repository';

@Injectable()
export class CheckinSessionService {
    constructor(
        private readonly checkinSessionRepository: CheckinSessionRepository,
        private readonly activityService: ActivityService,
    ) { }

    async create(createCheckinSessionDto: CreateCheckinSessionDto) {
        if (!Types.ObjectId.isValid(createCheckinSessionDto.activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityService.findById(createCheckinSessionDto.activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        if (createCheckinSessionDto.startTime >= createCheckinSessionDto.endTime) {
            throw new BadRequestException('startTime phải nhỏ hơn endTime');
        }

        const checkinSession = {
            activityId: new Types.ObjectId(createCheckinSessionDto.activityId),
            location: createCheckinSessionDto.location,
            startTime: createCheckinSessionDto.startTime,
            endTime: createCheckinSessionDto.endTime,
            radiusMetters: createCheckinSessionDto.radiusMetters,
        };

        return this.checkinSessionRepository.create(checkinSession);
    }
}
