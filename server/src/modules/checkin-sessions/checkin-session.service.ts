import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ActivityService } from '../activities/activity.service';
import { CreateCheckinSessionDto } from './dtos/create.checkin-session.dto';
import { CheckinSessionRepository } from './checkin-session.repository';
import { CheckinSession } from './checkin-session.entity';
import { UpdateCheckinSessionDto } from './dtos/update.checkin-session.dto';
import { UserRole } from 'src/global/globalEnum';

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

        if (createCheckinSessionDto.startTime < activity.startAt) {
            throw new BadRequestException('startTime của phiên điểm danh không được trước thời gian bắt đầu của hoạt động');
        }

        if (activity.endAt && createCheckinSessionDto.endTime > activity.endAt) {
            throw new BadRequestException('endTime của phiên điểm danh không được sau thời gian kết thúc của hoạt động');
        }

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

        return this.checkinSessionRepository.create(checkinSession);
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

        if (updateCheckinSessionDto.startTime >= updateCheckinSessionDto.endTime) {
            throw new BadRequestException('startTime phải nhỏ hơn endTime');
        }

        if (updateCheckinSessionDto.startTime < activity.startAt) {
            throw new BadRequestException('startTime của phiên điểm danh không được trước thời gian bắt đầu của hoạt động');
        }

        if (activity.endAt && updateCheckinSessionDto.endTime > activity.endAt) {
            throw new BadRequestException('endTime của phiên điểm danh không được sau thời gian kết thúc của hoạt động');
        }

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
}
