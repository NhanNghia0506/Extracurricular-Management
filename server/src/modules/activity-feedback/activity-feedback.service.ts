import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizerMemberRole, UserRole, ActivityStatus } from 'src/global/globalEnum';
import { ActivityService } from '../activities/activity.service';
import { OrganizerMemberService } from '../organizer-members/organizer-member.service';
import StudentService from '../students/student.service';
import { ActivityFeedbackRepository } from './activity-feedback.repository';
import { ActivityFeedbackDocument } from './activity-feedback.entity';
import { CreateActivityFeedbackDto } from './dtos/create-activity-feedback.dto';
import { ListActivityFeedbackDto } from './dtos/list-activity-feedback.dto';
import { UpdateActivityFeedbackDto } from './dtos/update-activity-feedback.dto';

export interface FeedbackResponse {
    id: string;
    activityId: string;
    authorId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    canEdit: boolean;
}

export interface FeedbackListResponse {
    items: FeedbackResponse[];
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

export interface FeedbackDashboardResponse {
    totalFeedbacks: number;
    averageRating: number;
    ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
    recentFeedbacks: FeedbackResponse[];
}

@Injectable()
export class ActivityFeedbackService {
    constructor(
        private readonly activityFeedbackRepository: ActivityFeedbackRepository,
        private readonly activityService: ActivityService,
        private readonly organizerMemberService: OrganizerMemberService,
        private readonly studentService: StudentService,
    ) { }

    private toResponse(item: ActivityFeedbackDocument, currentUserId?: string): FeedbackResponse {
        const authorId = item.authorId.toString();
        return {
            id: item._id.toString(),
            activityId: item.activityId.toString(),
            authorId,
            rating: item.rating,
            comment: item.comment,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            canEdit: Boolean(currentUserId && currentUserId === authorId),
        };
    }

    private async ensureStudentUser(userId: string): Promise<void> {
        try {
            await this.studentService.getStudentFullInfo(userId);
        } catch {
            throw new ForbiddenException('Chỉ sinh viên mới có thể gửi đánh giá hoạt động');
        }
    }

    private extractObjectId(value: unknown): string {
        if (!value) {
            return '';
        }

        if (typeof value === 'string') {
            return value;
        }

        if (value instanceof Types.ObjectId) {
            return value.toString();
        }

        if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
            const nested = (value as Record<string, unknown>)._id;
            if (nested instanceof Types.ObjectId) {
                return nested.toString();
            }
            if (typeof nested === 'string') {
                return nested;
            }
        }

        return '';
    }

    private async ensureDashboardAccess(activityId: string, currentUserId: string, currentUserRole?: string): Promise<void> {
        const normalizedRole = currentUserRole ? String(currentUserRole) : undefined;
        const adminRoleValue = String(UserRole.ADMIN);
        const activity = await this.activityService.findById(activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        if (normalizedRole === adminRoleValue) {
            return;
        }

        if (activity.createdBy?.toString() === currentUserId) {
            return;
        }

        const organizerId = this.extractObjectId(activity.organizerId);
        if (!organizerId) {
            throw new ForbiddenException('Bạn không có quyền xem dashboard đánh giá của hoạt động này');
        }

        const membership = await this.organizerMemberService.findByUserIdAndOrganizerId(currentUserId, organizerId);
        if (
            membership &&
            [OrganizerMemberRole.MANAGER, OrganizerMemberRole.ADMIN].includes(membership.role)
        ) {
            return;
        }

        throw new ForbiddenException('Bạn không có quyền xem dashboard đánh giá của hoạt động này');
    }

    async create(
        activityId: string,
        createDto: CreateActivityFeedbackDto,
        currentUserId: string,
        currentUserRole?: string,
    ): Promise<FeedbackResponse> {
        const normalizedRole = currentUserRole ? String(currentUserRole) : undefined;
        const userRoleValue = String(UserRole.USER);

        if (!Types.ObjectId.isValid(activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        if (!Types.ObjectId.isValid(currentUserId)) {
            throw new BadRequestException('userId phải là MongoDB ObjectId hợp lệ');
        }

        if (normalizedRole && normalizedRole !== userRoleValue) {
            throw new ForbiddenException('Chỉ sinh viên mới có thể gửi đánh giá hoạt động');
        }

        await this.ensureStudentUser(currentUserId);

        const activity = await this.activityService.findById(activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        if (activity.status !== ActivityStatus.COMPLETED) {
            throw new ForbiddenException('Chỉ có thể đánh giá khi hoạt động đã kết thúc');
        }

        const hasAttended = await this.activityFeedbackRepository.hasSuccessfulAttendanceForActivity(
            activityId,
            currentUserId,
        );

        if (!hasAttended) {
            throw new ForbiddenException('Bạn chỉ có thể đánh giá hoạt động mà bạn đã điểm danh');
        }

        const existing = await this.activityFeedbackRepository.findByActivityAndAuthor(activityId, currentUserId);
        if (existing) {
            throw new ConflictException('Bạn đã gửi đánh giá cho hoạt động này');
        }

        const created = await this.activityFeedbackRepository.create({
            activityId,
            authorId: currentUserId,
            rating: createDto.rating,
            comment: createDto.comment.trim(),
        });

        return this.toResponse(created, currentUserId);
    }

    async update(
        feedbackId: string,
        updateDto: UpdateActivityFeedbackDto,
        currentUserId: string,
    ): Promise<FeedbackResponse> {
        if (!Types.ObjectId.isValid(feedbackId)) {
            throw new BadRequestException('feedbackId phải là MongoDB ObjectId hợp lệ');
        }

        const hasRating = typeof updateDto.rating === 'number';
        const hasComment = typeof updateDto.comment === 'string';

        if (!hasRating && !hasComment) {
            throw new BadRequestException('Vui lòng cung cấp ít nhất một trường để cập nhật');
        }

        const existing = await this.activityFeedbackRepository.findById(feedbackId);
        if (!existing) {
            throw new NotFoundException('Không tìm thấy đánh giá với ID đã cho');
        }

        if (existing.authorId.toString() !== currentUserId) {
            throw new ForbiddenException('Bạn chỉ có thể chỉnh sửa đánh giá của chính mình');
        }

        const updated = await this.activityFeedbackRepository.updateById(feedbackId, {
            rating: updateDto.rating,
            comment: updateDto.comment?.trim(),
        });

        if (!updated) {
            throw new NotFoundException('Không tìm thấy đánh giá với ID đã cho');
        }

        return this.toResponse(updated, currentUserId);
    }

    async listByActivity(
        activityId: string,
        query: ListActivityFeedbackDto,
        currentUserId: string,
        currentUserRole?: string,
    ): Promise<FeedbackListResponse> {
        if (!Types.ObjectId.isValid(activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        await this.ensureDashboardAccess(activityId, currentUserId, currentUserRole);

        const limit = query.limit ?? 10;
        const skip = query.skip ?? 0;
        const sort = query.sort ?? 'newest';

        const [total, items] = await Promise.all([
            this.activityFeedbackRepository.countByActivity(activityId),
            this.activityFeedbackRepository.findByActivity(activityId, limit, skip, sort),
        ]);

        return {
            items: items.map((item) => this.toResponse(item, currentUserId)),
            total,
            limit,
            skip,
            hasMore: skip + items.length < total,
        };
    }

    async getDashboard(
        activityId: string,
        currentUserId: string,
        currentUserRole?: string,
    ): Promise<FeedbackDashboardResponse> {
        if (!Types.ObjectId.isValid(activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        await this.ensureDashboardAccess(activityId, currentUserId, currentUserRole);

        const data = await this.activityFeedbackRepository.getDashboard(activityId, 5);

        return {
            totalFeedbacks: data.totalFeedbacks,
            averageRating: Number(data.averageRating.toFixed(1)),
            ratingDistribution: data.ratingDistribution,
            recentFeedbacks: data.recentFeedbacks.map((item) => this.toResponse(item, currentUserId)),
        };
    }
}
