import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { ActivityRepository } from './activity.repository';
import { CreateActivityDto } from './dtos/create.activity.dto';
import { UpdateActivityDto } from './dtos/update.activity.dto';
import { Types } from 'mongoose';
import { ActivityStatus } from '../../global/globalEnum';
import { Activity } from './activity.entity';
import { ActivityDetailResponse } from 'src/global/globalInterface';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { UploadService } from '../../interceptors/upload.service';


@Injectable()
export class ActivityService {
    constructor(
        private readonly activityRepository: ActivityRepository,
        @Inject(forwardRef(() => ActivityParticipantService))
        private readonly activityParticipantService: ActivityParticipantService,
        private readonly uploadService: UploadService,
    ) { }

    /**
     * Tạo activity mới
     * @param createActivityDto - DTO chứa thông tin activity
     * @returns Activity đã được tạo
     */
    async create(createdBy: string, createActivityDto: CreateActivityDto): Promise<Activity> {
        if (
            !Types.ObjectId.isValid(createActivityDto.organizerId) ||
            !Types.ObjectId.isValid(createActivityDto.categoryId)
        ) {
            throw new BadRequestException(
                'organizerId và categoryId phải là MongoDB ObjectId hợp lệ',
            );
        }

        if (!Types.ObjectId.isValid(createdBy)) {
            throw new BadRequestException('createdBy phải là MongoDB ObjectId hợp lệ');
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
            createdBy: new Types.ObjectId(createdBy),
        };

        // Lưu vào database
        const result = await this.activityRepository.create(activity);
        return result;
    }

    /**
     * Lấy danh sách activities
     * @returns Danh sách Activity
     */
    async findAll(userId?: string): Promise<Array<Activity & { isMine: boolean }>> {
        const activities = await this.activityRepository.findAll();
        const normalizedUserId = userId?.toString();
        return activities.map((activity) => ({
            ...activity,
            isMine: Boolean(
                normalizedUserId && activity.createdBy?.toString() === normalizedUserId,
            ),
        }))
    }

    /**
     * Lấy chi tiết activity theo ID
     * @param id - ID của activity
     * @returns Chi tiết Activity
     */
    async findActivityDetailById(id: string, userId: string | undefined): Promise<ActivityDetailResponse | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        const participantCount = await this.activityParticipantService.countParticipantsByActivity(id);
        const isRegistered = userId ? await this.activityParticipantService.findByActivityAndUserId(id, userId) !== null : false;
        const isOwner = userId === activity.createdBy?.toString();
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
            isRegistered: isRegistered,
            isOwner: isOwner,
        } as ActivityDetailResponse;
    }

    findById(id: string): Promise<Activity | null> {
        return this.activityRepository.findById(id);
    }

    async getMyActivities(
        userId: string,
    ): Promise<Array<Activity & { relation: 'created' | 'participated' }>> {
        const myActivitiesCreated = await this.activityRepository.findByUserId(userId);
        const myActivitiesParticipated = await this.activityParticipantService.findActivitiesByUserId(userId);

        const createdItems = myActivitiesCreated.map((activity) => ({
            ...activity,
            relation: 'created' as const,
        }));

        const participatedItems = (myActivitiesParticipated as Activity[]).map((activity) => ({
            ...activity,
            relation: 'participated' as const,
        }));

        return [...createdItems, ...participatedItems];
    }

    /**
     * Cập nhật activity - chỉ chủ sở hữu (createdBy) mới có thể cập nhật
     * @param id - ID của activity
     * @param userId - ID user hiện tại
     * @param updateActivityDto - Dữ liệu cần cập nhật (partial)
     * @param newImageFilename - Tên file ảnh mới (nếu có)
     * @returns Activity đã cập nhật
     */
    async update(
        id: string,
        userId: string,
        updateActivityDto: UpdateActivityDto,
        newImageFilename?: string,
    ): Promise<Activity> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('userId phải là MongoDB ObjectId hợp lệ');
        }

        // Kiểm tra activity tồn tại
        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        // Kiểm tra quyền: chỉ chủ sở hữu mới được chỉnh sửa
        if (activity.createdBy.toString() !== userId) {
            throw new ForbiddenException('Bạn chỉ có quyền chỉnh sửa hoạt động của chính mình');
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData: Partial<Activity> = {};

        // Chỉ cập nhật các trường được cung cấp
        if (updateActivityDto.title) updateData.title = updateActivityDto.title;
        if (updateActivityDto.description) updateData.description = updateActivityDto.description;
        if (updateActivityDto.location) updateData.location = updateActivityDto.location;
        if (updateActivityDto.status) updateData.status = updateActivityDto.status;
        if (updateActivityDto.startAt) updateData.startAt = updateActivityDto.startAt;
        if (updateActivityDto.endAt) updateData.endAt = updateActivityDto.endAt;
        if (updateActivityDto.trainingScore !== undefined) updateData.trainingScore = updateActivityDto.trainingScore;
        if (updateActivityDto.participantCount !== undefined) updateData.participantCount = updateActivityDto.participantCount;

        // Xử lý ảnh: nếu có ảnh mới, xóa ảnh cũ rồi cập nhật ảnh mới
        if (newImageFilename) {
            // Xóa ảnh cũ nếu tồn tại
            if (activity.image) {
                this.uploadService.deleteFile(activity.image);
            }
            updateData.image = newImageFilename;
        }

        // Cập nhật vào database
        const updatedActivity = await this.activityRepository.update(id, updateData);
        if (!updatedActivity) {
            throw new NotFoundException('Lỗi khi cập nhật hoạt động');
        }

        return updatedActivity;
    }
}