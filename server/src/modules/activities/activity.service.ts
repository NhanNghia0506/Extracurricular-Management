import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef, ForbiddenException, Logger } from '@nestjs/common';
import {
    ActivityApprovalRecord,
    ActivityNamedReference,
    ActivityRepository,
    RecommendationCandidateRecord,
    ActivityUserReference,
    ActivityStatsRecord,
} from './activity.repository';
import { CreateActivityDto } from './dtos/create.activity.dto';
import { ActivityRecommendationQueryDto } from './dtos/activity-recommendation-query.dto';
import { SendActivityNotificationDto } from './dtos/send-activity-notification.dto';
import { UpdateActivityDto } from './dtos/update.activity.dto';
import { Model, Types } from 'mongoose';
import { ActivityStatus, NotificationPriority, NotificationType, OrganizerApprovalStatus, UserRole } from '../../global/globalEnum';
import { Activity } from './activity.entity';
import {
    ActivityApprovalDashboardResponse,
    ActivityApprovalDetailResponse,
    ActivityApprovalListItemResponse,
    ActivityApprovalStatsResponse,
    ActivityDetailResponse,
} from 'src/global/globalInterface';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { ParticipantStatus } from '../activity-participants/activity-participant.entity';
import { UploadService } from '../../interceptors/upload.service';
import { NotificationService } from '../notifications/notification.service';
import { MailService } from '../mail/mail.service';
import { InjectModel } from '@nestjs/mongoose';
import { Organizer } from '../organizers/organizer.entity';
import { OrganizerMemberService } from '../organizer-members/organizer-member.service';
import { OrganizerMemberRole } from 'src/global/globalEnum';
import { CertificateService, IssueResult } from '../certificates/certificate.service';
import { ActivityStatsQueryDto } from './dtos/activity-stats.query.dto';
import { ActivityStatsResponseDto } from './dtos/activity-stats.response.dto';

type ActivityApprovalValue = Activity['approvalStatus'];

const ACTIVITY_APPROVAL_STATUS: Record<'PENDING' | 'NEEDS_EDIT' | 'APPROVED' | 'REJECTED', ActivityApprovalValue> = {
    PENDING: 'PENDING' as ActivityApprovalValue,
    NEEDS_EDIT: 'NEEDS_EDIT' as ActivityApprovalValue,
    APPROVED: 'APPROVED' as ActivityApprovalValue,
    REJECTED: 'REJECTED' as ActivityApprovalValue,
};

interface ActivityApprovalReviewPayload {
    approvalStatus: ActivityApprovalValue;
    reviewNote?: string;
    isPriority?: boolean;
    notifyOrganizer?: boolean;
}

interface ActivityRecommendationItem {
    id: string;
    isMine: boolean;
    title: string;
    description: string;
    image?: string;
    location?: Activity['location'];
    status: ActivityStatus;
    startAt: Date;
    endAt?: Date;
    trainingScore: number;
    participantCount: number;
    organizerId: { _id?: Types.ObjectId; name?: string } | null;
    categoryId: { _id?: Types.ObjectId; name?: string } | null;
    averageRating: number;
    matchScore: number;
    reason: string;
    isPriority: boolean;
}

interface CertificateIssuanceRecord {
    userId: string;
    result: IssueResult;
}

interface IssuedCertificatePayload {
    _id?: Types.ObjectId | { toString(): string };
    certificateCode: string;
    issuedAt: Date;
}

type ActivityStatsPeriodType = 'month' | 'quarter' | 'year';


@Injectable()
export class ActivityService {
    private static readonly DELETE_NOTICE_PERIOD_IN_MS = 2 * 24 * 60 * 60 * 1000;
    private readonly logger = new Logger(ActivityService.name);

    constructor(
        private readonly activityRepository: ActivityRepository,
        @Inject(forwardRef(() => ActivityParticipantService))
        private readonly activityParticipantService: ActivityParticipantService,
        private readonly uploadService: UploadService,
        private readonly notificationService: NotificationService,
        private readonly mailService: MailService,
        private readonly organizerMemberService: OrganizerMemberService,
        private readonly certificateService: CertificateService,
        @InjectModel(Organizer.name)
        private readonly organizerModel: Model<Organizer>,
    ) { }

    /**
     * Tạo activity mới
     * @param createActivityDto - DTO chứa thông tin activity
     * @returns Activity đã được tạo
     */
    async create(createdBy: string, userRole: string | undefined, createActivityDto: CreateActivityDto): Promise<Activity> {
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

        await this.ensureOrganizerApproved(createActivityDto.organizerId);

        // Tạo entity
        const approvalStatus: ActivityApprovalValue = userRole === UserRole.ADMIN
            ? ACTIVITY_APPROVAL_STATUS.APPROVED
            : ACTIVITY_APPROVAL_STATUS.PENDING;

        const activity: Partial<Activity> = {
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
            approvalStatus,
            reviewedBy: userRole === UserRole.ADMIN ? new Types.ObjectId(createdBy) : null,
            reviewedAt: userRole === UserRole.ADMIN ? new Date() : null,
            reviewNote: null,
            isPriority: false,
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

    async getRecommendations(
        userId: string,
        query: ActivityRecommendationQueryDto,
    ): Promise<{ strategy: 'hybrid'; items: ActivityRecommendationItem[] }> {
        const limit = query.limit || 6;

        const [joinedActivityIds, categoryAffinities, academicContext] = await Promise.all([
            // Lấy hoạt động mà người dùng đã tham gia
            this.activityRepository.getJoinedActivityIds(userId),
            // map danh mục
            this.activityRepository.getUserCategoryAffinities(userId),
            this.activityRepository.getStudentAcademicContext(userId),
        ]);

        const candidates = await this.activityRepository.findRecommendationCandidates(
            userId,
            joinedActivityIds,
            academicContext.classId,
            academicContext.facultyId,
        );

        const items = candidates
            .map((item) => this.scoreRecommendation(item, categoryAffinities, userId))
            .sort((a, b) => {
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }
                return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
            })
            .slice(0, limit);

        return {
            strategy: 'hybrid',
            items,
        };
    }

    async getAdminStats(userRole: string | undefined, query: ActivityStatsQueryDto): Promise<ActivityStatsResponseDto> {
        this.ensureSystemAdmin(userRole);

        const periodType = this.parsePeriodType(query.periodType);
        const year = this.parseYear(query.year);
        const month = this.parseMonth(query.month);
        const quarter = this.parseQuarter(query.quarter);
        const { startDate, endDate } = this.resolvePeriodRange(periodType, year, month, quarter);

        const records = await this.activityRepository.findActivityStatsRecords({
            startDate,
            endDate,
        });

        const now = Date.now();
        const activitiesByStatus = {
            upcoming: 0,
            ongoing: 0,
            completed: 0,
        };

        const categoryMap = new Map<string, number>();
        let cancelledCount = 0;
        let totalDurationHours = 0;
        let durationCount = 0;

        for (const item of records) {
            const statusBucket = this.resolveStatusBucket(item, now);
            if (statusBucket === 'cancelled') {
                cancelledCount += 1;
            } else {
                activitiesByStatus[statusBucket] += 1;
            }

            categoryMap.set(item.categoryName, (categoryMap.get(item.categoryName) || 0) + 1);

            if (item.endAt) {
                const durationMs = new Date(item.endAt).getTime() - new Date(item.startAt).getTime();
                if (durationMs > 0) {
                    totalDurationHours += durationMs / (1000 * 60 * 60);
                    durationCount += 1;
                }
            }
        }

        const totalActivities = records.length;
        const cancellationRate = totalActivities > 0
            ? Number(((cancelledCount / totalActivities) * 100).toFixed(2))
            : 0;
        const averageDurationHours = durationCount > 0
            ? Number((totalDurationHours / durationCount).toFixed(2))
            : 0;

        const activitiesByCategory = Array.from(categoryMap.entries())
            .map(([categoryName, count]) => ({ categoryName, count }))
            .sort((a, b) => b.count - a.count);

        const topByParticipants = [...records]
            .sort((a, b) => {
                if (b.participantCount !== a.participantCount) {
                    return b.participantCount - a.participantCount;
                }
                return b.averageRating - a.averageRating;
            })
            .slice(0, 10)
            .map((item) => ({
                activityId: item.activityId,
                title: item.title,
                participantCount: item.participantCount,
                averageRating: item.averageRating,
                startAt: item.startAt,
            }));

        const topByRating = [...records]
            .sort((a, b) => {
                if (b.averageRating !== a.averageRating) {
                    return b.averageRating - a.averageRating;
                }
                return b.participantCount - a.participantCount;
            })
            .filter((item) => item.averageRating > 0)
            .slice(0, 10)
            .map((item) => ({
                activityId: item.activityId,
                title: item.title,
                participantCount: item.participantCount,
                averageRating: item.averageRating,
                startAt: item.startAt,
            }));

        return {
            kpi: {
                totalActivities,
                cancellationRate,
                averageDurationHours,
            },
            activitiesByStatus,
            activitiesByCategory,
            periodTrend: this.buildPeriodTrend(records, periodType, year, month, quarter),
            topByParticipants,
            topByRating,
        };
    }

    /**
     * Lấy chi tiết activity theo ID
     * @param id - ID của activity
     * @returns Chi tiết Activity
     */
    async findActivityDetailById(
        id: string,
        userId: string | undefined,
        userRole?: string,
    ): Promise<ActivityDetailResponse | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        this.ensureActivityVisible(activity, userId, userRole);

        const participantCount = await this.activityParticipantService.countParticipantsByActivity(id);
        const participantRegistration = userId
            ? await this.activityParticipantService.findByActivityAndUserId(id, userId)
            : null;
        const participantStatus = participantRegistration?.status || null;
        const isRegistered = participantRegistration !== null
            && participantStatus !== ParticipantStatus.CANCELLED
            && participantStatus !== ParticipantStatus.REJECTED;
        const isOwner = userId === activity.createdBy?.toString();
        const canDelete = this.canDeleteActivity(activity, userId, userRole);
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
            participantRegistrationId: participantRegistration?._id?.toString?.() || null,
            participantStatus,
            isOwner: isOwner,
            canDelete,
            approvalStatus: activity.approvalStatus,
            reviewNote: activity.reviewNote || null,
        } as ActivityDetailResponse;
    }

    /**
     * Lấy activity theo id để tái sử dụng ở các module khác.
     */
    findById(id: string): Promise<Activity | null> {
        return this.activityRepository.findById(id);
    }

    findIdsByOrganizerId(organizerId: string): Promise<string[]> {
        return this.activityRepository.findIdsByOrganizerId(organizerId);
    }

    /**
     * Gộp danh sách activity user đã tạo và đã tham gia.
     */
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

    async sendNotificationToParticipants(
        activityId: string,
        senderUserId: string,
        senderUserRole: string | undefined,
        payload: SendActivityNotificationDto,
    ): Promise<{ recipientCount: number; activityId: string }> {
        if (!Types.ObjectId.isValid(activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        if (!Types.ObjectId.isValid(senderUserId)) {
            throw new BadRequestException('senderUserId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityRepository.findById(activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        this.ensureParticipantNotificationAllowed(activity, senderUserId, senderUserRole);

        const participants = await this.activityParticipantService.findByActivityId(activityId);
        const participantUserIds = Array.from(
            new Set(participants.map((participant) => participant.userId?.toString()).filter((value): value is string => Boolean(value))),
        );

        if (participantUserIds.length === 0) {
            throw new BadRequestException('Hoạt động hiện chưa có thành viên để gửi thông báo');
        }

        let targetUserIds = participantUserIds;
        if (payload.recipientMode === 'SELECTED') {
            const selectedUserIds = Array.from(
                new Set((payload.recipientUserIds || []).map((value) => value.trim()).filter(Boolean)),
            );

            if (selectedUserIds.length === 0) {
                throw new BadRequestException('Vui lòng chọn ít nhất một thành viên để gửi thông báo');
            }

            const participantUserIdSet = new Set(participantUserIds);
            const invalidUserIds = selectedUserIds.filter((userId) => !participantUserIdSet.has(userId));
            if (invalidUserIds.length > 0) {
                throw new ForbiddenException('Có người nhận không thuộc danh sách thành viên của hoạt động');
            }

            targetUserIds = selectedUserIds;
        }


        // Gửi thông báo
        await this.notificationService.createBulkNotifications(targetUserIds, {
            senderName: payload.senderName?.trim() || activity.title,
            senderType: payload.senderType?.trim() || 'activity-owner',
            title: payload.title.trim(),
            message: payload.message.trim(),
            type: payload.type || NotificationType.ACTIVITY,
            priority: payload.priority || NotificationPriority.NORMAL,
            linkUrl: payload.linkUrl?.trim() || `/detail/${activityId}`,
            groupKey: payload.groupKey?.trim() || `activity-notification:${activityId}`,
            meta: {
                activityId,
                activityTitle: activity.title,
                recipientMode: payload.recipientMode,
                ...(payload.meta || {}),
            },
        });

        return {
            recipientCount: targetUserIds.length,
            activityId,
        };
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
        userRole: string | undefined,
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

        if (activity.status === ActivityStatus.COMPLETED) {
            throw new BadRequestException('Không thể chỉnh sửa hoạt động đã kết thúc');
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

        if (updateActivityDto.categoryId !== undefined) {
            if (!Types.ObjectId.isValid(updateActivityDto.categoryId)) {
                throw new BadRequestException('categoryId phải là MongoDB ObjectId hợp lệ');
            }
            updateData.categoryId = new Types.ObjectId(updateActivityDto.categoryId);
        }

        if (updateActivityDto.organizerId !== undefined) {
            if (!Types.ObjectId.isValid(updateActivityDto.organizerId)) {
                throw new BadRequestException('organizerId phải là MongoDB ObjectId hợp lệ');
            }

            await this.ensureOrganizerApproved(updateActivityDto.organizerId);

            if (userRole !== UserRole.ADMIN) {
                const member = await this.organizerMemberService.findByUserIdAndOrganizerId(userId, updateActivityDto.organizerId);
                if (!member || !member.isActive) {
                    throw new ForbiddenException('Bạn không thuộc ban tổ chức được chọn');
                }

                if (member.role !== OrganizerMemberRole.MANAGER) {
                    throw new ForbiddenException('Chỉ manager mới có quyền gán hoạt động cho ban tổ chức này');
                }
            }

            updateData.organizerId = new Types.ObjectId(updateActivityDto.organizerId);
        }

        // Xử lý ảnh: nếu có ảnh mới, xóa ảnh cũ rồi cập nhật ảnh mới
        if (newImageFilename) {
            // Xóa ảnh cũ nếu tồn tại
            if (activity.image) {
                this.uploadService.deleteFile(activity.image);
            }
            updateData.image = newImageFilename;
        }

        if (userRole !== UserRole.ADMIN) {
            updateData.approvalStatus = ACTIVITY_APPROVAL_STATUS.PENDING;
            updateData.reviewNote = null;
            updateData.reviewedBy = null;
            updateData.reviewedAt = null;
            updateData.isPriority = activity.isPriority ?? false;
        }

        // Cập nhật vào database
        const updatedActivity = await this.activityRepository.update(id, updateData);
        if (!updatedActivity) {
            throw new NotFoundException('Lỗi khi cập nhật hoạt động');
        }

        return updatedActivity;
    }

    /**
     * Kết thúc activity nếu người dùng là chủ sở hữu và activity đã được duyệt.
     */
    async endActivity(id: string, userId: string): Promise<Activity> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('userId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        if (activity.createdBy.toString() !== userId) {
            throw new ForbiddenException('Bạn chỉ có quyền kết thúc hoạt động của chính mình');
        }

        if (activity.approvalStatus !== ACTIVITY_APPROVAL_STATUS.APPROVED) {
            throw new BadRequestException('Chỉ có thể kết thúc hoạt động đã được duyệt');
        }

        if (activity.status === ActivityStatus.COMPLETED) {
            throw new BadRequestException('Hoạt động này đã được kết thúc trước đó');
        }

        if (activity.status === ActivityStatus.CANCELLED) {
            throw new BadRequestException('Không thể kết thúc một hoạt động đã bị hủy');
        }

        const updatedActivity = await this.activityRepository.update(id, {
            status: ActivityStatus.COMPLETED,
        });

        if (!updatedActivity) {
            throw new NotFoundException('Lỗi khi kết thúc hoạt động');
        }

        try {
            await this.activityParticipantService.finalizeParticipationStatuses(id);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Không thể chốt trạng thái tham gia cho activity ${id}: ${reason}`);
        }

        try {
            await this.issueCertificatesAndNotify(activity.id?.toString?.() || id, activity.title);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Không thể phát hành chứng nhận cho activity ${id}: ${reason}`);
        }

        return updatedActivity;
    }

    /**
     * Xóa activity nếu người dùng có quyền và vẫn còn trong thời hạn cho phép.
     */
    async delete(id: string, userId: string, userRole?: string): Promise<Activity> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('userId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        this.ensureDeleteAllowed(activity, userId, userRole);

        await this.activityParticipantService.deleteByActivityId(id);

        const deletedActivity = await this.activityRepository.delete(id);
        if (!deletedActivity) {
            throw new NotFoundException('Lỗi khi xóa hoạt động');
        }

        if (activity.image) {
            this.uploadService.deleteFile(activity.image);
        }

        return deletedActivity;
    }

    /**
     * Trả về danh sách activity cần duyệt kèm thống kê cho trang admin approval.
     */
    async getApprovalDashboard(
        userRole: string | undefined,
        approvalStatus?: ActivityApprovalValue,
    ): Promise<ActivityApprovalDashboardResponse> {
        this.ensureSystemAdmin(userRole);

        const [items, stats] = await Promise.all([
            this.findAllApprovalRecords(approvalStatus),
            this.getApprovalStats(userRole),
        ]);

        return {
            items: items.map((activity) => this.mapApprovalListItem(activity)),
            stats,
        };
    }

    /**
     * Lấy đầy đủ dữ liệu của một activity để admin xem và xử lý duyệt bài.
     */
    async getApprovalDetail(id: string, userRole: string | undefined): Promise<ActivityApprovalDetailResponse> {
        this.ensureSystemAdmin(userRole);

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.findApprovalRecordById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        const baseItem = this.mapApprovalListItem(activity);

        return {
            ...baseItem,
            description: activity.description,
            endAt: activity.endAt,
            image: activity.image,
            location: activity.location,
            trainingScore: activity.trainingScore,
            participantCount: activity.participantCount,
            reviewedAt: activity.reviewedAt || null,
            reviewedBy: activity.reviewedBy
                ? {
                    id: activity.reviewedBy._id?.toString(),
                    name: activity.reviewedBy.name,
                    email: activity.reviewedBy.email,
                }
                : null,
        };
    }

    /**
     * Cập nhật kết quả duyệt bài của admin: duyệt, từ chối hoặc yêu cầu chỉnh sửa.
     */
    async reviewActivity(
        id: string,
        adminId: string,
        userRole: string | undefined,
        reviewDto: ActivityApprovalReviewPayload,
    ): Promise<ActivityApprovalDetailResponse> {
        this.ensureSystemAdmin(userRole);

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        if (!Types.ObjectId.isValid(adminId)) {
            throw new BadRequestException('adminId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityRepository.findById(id);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        const approvalStatus = reviewDto.approvalStatus;
        const reviewNote = reviewDto.reviewNote?.trim();
        const isPriority = reviewDto.isPriority ?? activity.isPriority ?? false;

        if (approvalStatus === ACTIVITY_APPROVAL_STATUS.APPROVED) {
            await this.ensureOrganizerApproved(this.extractObjectIdString(activity.organizerId));
        }

        if (
            [ACTIVITY_APPROVAL_STATUS.NEEDS_EDIT, ACTIVITY_APPROVAL_STATUS.REJECTED].includes(approvalStatus) &&
            !reviewNote
        ) {
            throw new BadRequestException('Cần nhập ghi chú phản hồi khi yêu cầu chỉnh sửa hoặc từ chối');
        }

        const updatedActivity = await this.activityRepository.update(id, {
            approvalStatus,
            reviewNote: reviewNote || null,
            reviewedBy: new Types.ObjectId(adminId),
            reviewedAt: new Date(),
            isPriority,
        });

        if (!updatedActivity) {
            throw new NotFoundException('Lỗi khi cập nhật trạng thái duyệt hoạt động');
        }

        await this.notifyCreatorOnReview(activity, approvalStatus, reviewNote, reviewDto.notifyOrganizer);

        return this.getApprovalDetail(id, userRole);
    }

    /**
     * Tính các chỉ số tổng quan cho dashboard duyệt bài của admin.
     */
    async getApprovalStats(userRole: string | undefined): Promise<ActivityApprovalStatsResponse> {
        this.ensureSystemAdmin(userRole);

        const [pending, approved, needsEdit, rejected, overdueItems] = await Promise.all([
            this.countByApprovalStatus(ACTIVITY_APPROVAL_STATUS.PENDING),
            this.countByApprovalStatus(ACTIVITY_APPROVAL_STATUS.APPROVED),
            this.countByApprovalStatus(ACTIVITY_APPROVAL_STATUS.NEEDS_EDIT),
            this.countByApprovalStatus(ACTIVITY_APPROVAL_STATUS.REJECTED),
            this.findAllApprovalRecords(ACTIVITY_APPROVAL_STATUS.PENDING),
        ]);

        return {
            pending,
            approved,
            needsEdit,
            rejected,
            overdue: overdueItems.filter((activity) => this.getWarningTag(activity) !== null).length,
        };
    }

    /**
     * Kiểm tra nhanh user hiện tại có thể xóa activity hay không để trả về cho UI.
     */
    private canDeleteActivity(activity: Activity, userId?: string, userRole?: string): boolean {
        if (!userId) {
            return false;
        }

        const isOwner = activity.createdBy?.toString() === userId;
        const isAdmin = userRole === UserRole.ADMIN;
        const deleteDeadline = new Date(activity.startAt).getTime() - ActivityService.DELETE_NOTICE_PERIOD_IN_MS;

        return (isOwner || isAdmin) && Date.now() <= deleteDeadline;
    }

    private ensureParticipantNotificationAllowed(activity: Activity, userId: string, userRole?: string): void {
        const isOwner = activity.createdBy?.toString() === userId;
        const isAdmin = userRole === UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Chỉ người tạo hoạt động hoặc admin hệ thống mới có quyền gửi thông báo');
        }
    }

    /**
     * Chặn hành vi xóa activity nếu không đúng quyền hoặc đã quá thời hạn xóa.
     */
    private ensureDeleteAllowed(activity: Activity, userId: string, userRole?: string): void {
        const isOwner = activity.createdBy?.toString() === userId;
        const isAdmin = userRole === UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Chỉ người tạo hoạt động hoặc admin hệ thống mới được xóa hoạt động');
        }

        const deleteDeadline = new Date(activity.startAt).getTime() - ActivityService.DELETE_NOTICE_PERIOD_IN_MS;
        if (Date.now() > deleteDeadline) {
            throw new ForbiddenException('Chỉ được xóa hoạt động trước thời điểm diễn ra ít nhất 2 ngày');
        }
    }

    /**
     * Bảo vệ các API chỉ dành cho admin hệ thống.
     */
    private ensureSystemAdmin(userRole?: string): void {
        if (userRole !== UserRole.ADMIN) {
            throw new ForbiddenException('Chỉ admin hệ thống mới có quyền thực hiện thao tác này');
        }
    }

    /**
     * Đảm bảo activity chưa duyệt chỉ hiển thị cho owner hoặc admin hệ thống.
     */
    private ensureActivityVisible(activity: Activity, userId?: string, userRole?: string): void {
        const isOwner = Boolean(userId && activity.createdBy?.toString() === userId);
        const isAdmin = userRole === UserRole.ADMIN;

        if (activity.approvalStatus !== ACTIVITY_APPROVAL_STATUS.APPROVED && !isOwner && !isAdmin) {
            throw new ForbiddenException('Hoạt động này chưa được duyệt công khai');
        }
    }

    private parsePeriodType(rawValue?: string): ActivityStatsPeriodType {
        if (rawValue === 'quarter' || rawValue === 'year') {
            return rawValue;
        }

        return 'month';
    }

    private parseMonth(rawValue?: string): number {
        const month = Number(rawValue || new Date().getMonth() + 1);
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            throw new BadRequestException('month phải nằm trong khoảng 1 đến 12');
        }
        return month;
    }

    private parseQuarter(rawValue?: string): number {
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        const quarter = Number(rawValue || currentQuarter);
        if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
            throw new BadRequestException('quarter phải nằm trong khoảng 1 đến 4');
        }
        return quarter;
    }

    private parseYear(rawValue?: string): number {
        const year = Number(rawValue || new Date().getFullYear());
        if (!Number.isInteger(year) || year < 2020 || year > 2100) {
            throw new BadRequestException('year không hợp lệ');
        }
        return year;
    }

    private resolvePeriodRange(periodType: ActivityStatsPeriodType, year: number, month: number, quarter: number): { startDate: Date; endDate: Date } {
        if (periodType === 'year') {
            return {
                startDate: new Date(year, 0, 1, 0, 0, 0, 0),
                endDate: new Date(year, 11, 31, 23, 59, 59, 999),
            };
        }

        if (periodType === 'quarter') {
            const startMonth = (quarter - 1) * 3;
            return {
                startDate: new Date(year, startMonth, 1, 0, 0, 0, 0),
                endDate: new Date(year, startMonth + 3, 0, 23, 59, 59, 999),
            };
        }

        return {
            startDate: new Date(year, month - 1, 1, 0, 0, 0, 0),
            endDate: new Date(year, month, 0, 23, 59, 59, 999),
        };
    }

    private resolveStatusBucket(record: ActivityStatsRecord, now: number): 'upcoming' | 'ongoing' | 'completed' | 'cancelled' {
        if (record.status === ActivityStatus.CANCELLED) {
            return 'cancelled';
        }

        if (record.status === ActivityStatus.COMPLETED) {
            return 'completed';
        }

        const start = new Date(record.startAt).getTime();
        const end = record.endAt ? new Date(record.endAt).getTime() : null;

        if (Number.isFinite(start) && now < start) {
            return 'upcoming';
        }

        if (end && now > end) {
            return 'completed';
        }

        return 'ongoing';
    }

    private buildPeriodTrend(
        records: ActivityStatsRecord[],
        periodType: ActivityStatsPeriodType,
        year: number,
        month: number,
        quarter: number,
    ): { labels: string[]; data: number[] } {
        if (periodType === 'year') {
            const labels = Array.from({ length: 12 }, (_, index) => `Th${index + 1}`);
            const data = Array.from({ length: 12 }, () => 0);

            for (const item of records) {
                const date = new Date(item.startAt);
                if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) {
                    continue;
                }
                data[date.getMonth()] += 1;
            }

            return { labels, data };
        }

        if (periodType === 'quarter') {
            const startMonth = (quarter - 1) * 3;
            const labels = Array.from({ length: 3 }, (_, index) => `Th${startMonth + index + 1}`);
            const data = Array.from({ length: 3 }, () => 0);

            for (const item of records) {
                const date = new Date(item.startAt);
                if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) {
                    continue;
                }

                const monthIndex = date.getMonth() - startMonth;
                if (monthIndex < 0 || monthIndex > 2) {
                    continue;
                }

                data[monthIndex] += 1;
            }

            return { labels, data };
        }

        const labels = [`Th${month}`];
        const data = [0];

        for (const item of records) {
            const date = new Date(item.startAt);
            if (
                Number.isNaN(date.getTime())
                || date.getFullYear() !== year
                || date.getMonth() !== month - 1
            ) {
                continue;
            }

            data[0] += 1;
        }

        return { labels, data };
    }

    private async ensureOrganizerApproved(organizerId?: string): Promise<void> {
        if (!organizerId || !Types.ObjectId.isValid(organizerId)) {
            throw new BadRequestException('organizerId phải là MongoDB ObjectId hợp lệ');
        }

        const organizer = await this.organizerModel.findById(organizerId).select('approvalStatus').lean();
        if (!organizer) {
            throw new NotFoundException('Không tìm thấy ban tổ chức với ID đã cho');
        }

        if (organizer.approvalStatus !== OrganizerApprovalStatus.APPROVED) {
            throw new ForbiddenException('Ban tổ chức chưa được duyệt nên chưa thể sử dụng chức năng này');
        }
    }

    private async issueCertificatesAndNotify(activityId: string, activityTitle: string): Promise<void> {
        const participants = await this.activityParticipantService.findByActivityId(activityId);
        const targetUserIds = Array.from(
            new Set(
                participants
                    .map((participant) => participant.userId?.toString())
                    .filter((value): value is string => Boolean(value)),
            ),
        );

        if (targetUserIds.length === 0) {
            return;
        }

        const issuanceResults: CertificateIssuanceRecord[] = await Promise.all(
            targetUserIds.map(async (userId) => ({
                userId,
                result: await this.certificateService.issueForUserActivityIfEligible(userId, activityId),
            })),
        );

        const notifiedUserIds = new Set<string>();
        await Promise.all(
            issuanceResults.map(async ({ userId, result }) => {
                const certificate = this.asIssuedCertificate(result.certificate);
                if (!certificate || notifiedUserIds.has(userId)) {
                    return;
                }

                notifiedUserIds.add(userId);
                await this.notificationService.createIfNotExistsByGroupKey({
                    userId,
                    senderName: 'Hệ thống chứng nhận',
                    senderType: 'activity-certificate',
                    title: 'Chứng nhận hoạt động',
                    message: `Chứng nhận cho hoạt động "${activityTitle}" đã được phát hành. Bạn có thể xem và tải về trong mục Chứng nhận của tôi.`,
                    type: NotificationType.ACTIVITY,
                    priority: NotificationPriority.NORMAL,
                    linkUrl: '/my-certificates',
                    groupKey: `certificate-issued:${activityId}:${userId}`,
                    meta: {
                        activityId,
                        activityTitle,
                        certificateId: certificate._id ? certificate._id.toString() : null,
                        certificateCode: certificate.certificateCode,
                        issuedAt: certificate.issuedAt,
                    },
                });
            }),
        );
    }

    private asIssuedCertificate(value: unknown): IssuedCertificatePayload | null {
        if (!value || typeof value !== 'object') {
            return null;
        }

        const candidate = value as Partial<IssuedCertificatePayload>;
        if (typeof candidate.certificateCode !== 'string' || !(candidate.issuedAt instanceof Date)) {
            return null;
        }

        return {
            _id: candidate._id,
            certificateCode: candidate.certificateCode,
            issuedAt: candidate.issuedAt,
        };
    }

    private extractObjectIdString(value: unknown): string | undefined {
        if (!value) {
            return undefined;
        }

        if (value instanceof Types.ObjectId) {
            return value.toString();
        }

        if (typeof value === 'string') {
            return value;
        }

        const objectValue = value as { _id?: unknown };
        if (objectValue._id instanceof Types.ObjectId) {
            return objectValue._id.toString();
        }

        if (typeof objectValue._id === 'string') {
            return objectValue._id;
        }

        return undefined;
    }

    /**
     * Chuẩn hóa dữ liệu activity thành item gọn cho danh sách duyệt bài.
     */
    private mapApprovalListItem(activity: ActivityApprovalRecord): ActivityApprovalListItemResponse {
        const organizer: ActivityNamedReference = activity.organizerId;
        const category: ActivityNamedReference = activity.categoryId;
        const createdBy = this.extractCreatedBy(activity.createdBy);

        return {
            id: activity._id.toString(),
            code: `ACT-${activity._id.toString().slice(-6).toUpperCase()}`,
            title: activity.title,
            image: activity.image,
            organizer: {
                id: organizer._id?.toString(),
                name: organizer.name,
            },
            category: {
                id: category._id?.toString(),
                name: category.name,
            },
            createdBy,
            startAt: activity.startAt,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            approvalStatus: activity.approvalStatus,
            status: activity.status,
            isPriority: Boolean(activity.isPriority),
            reviewNote: activity.reviewNote || null,
            warningTag: this.getWarningTag(activity),
        };
    }

    /**
     * Sinh nhãn cảnh báo nhanh để admin ưu tiên xử lý bài viết.
     */
    private getWarningTag(activity: Pick<ActivityApprovalRecord, 'startAt' | 'approvalStatus'>): string | null {
        const eventTime = new Date(activity.startAt).getTime();
        const diffInDays = (eventTime - Date.now()) / (24 * 60 * 60 * 1000);

        if (activity.approvalStatus === ACTIVITY_APPROVAL_STATUS.NEEDS_EDIT) {
            return 'Cần chỉnh sửa';
        }

        if (activity.approvalStatus === ACTIVITY_APPROVAL_STATUS.PENDING && diffInDays <= 7) {
            return 'Gần ngày tổ chức';
        }

        return null;
    }

    /**
     * Wrapper typed cho repository khi lấy danh sách approval records.
     */
    private async findAllApprovalRecords(approvalStatus?: ActivityApprovalValue): Promise<ActivityApprovalRecord[]> {
        const repository = this.activityRepository as {
            findAllForApproval: (value?: ActivityApprovalValue) => Promise<ActivityApprovalRecord[]>;
        };

        return repository.findAllForApproval(approvalStatus);
    }

    /**
     * Wrapper typed cho repository khi lấy chi tiết một approval record.
     */
    private async findApprovalRecordById(id: string): Promise<ActivityApprovalRecord | null> {
        const repository = this.activityRepository as {
            findApprovalById: (value: string) => Promise<ActivityApprovalRecord | null>;
        };

        return repository.findApprovalById(id);
    }

    /**
     * Wrapper typed để đếm số activity theo từng trạng thái duyệt.
     */
    private async countByApprovalStatus(approvalStatus: ActivityApprovalValue): Promise<number> {
        const repository = this.activityRepository as {
            countByApprovalStatus: (value: ActivityApprovalValue) => Promise<number>;
        };

        return repository.countByApprovalStatus(approvalStatus);
    }

    /**
     * Chuẩn hóa thông tin người tạo từ object populate hoặc ObjectId thuần.
     */
    private extractCreatedBy(createdBy: Types.ObjectId | ActivityUserReference): ActivityApprovalListItemResponse['createdBy'] {
        if (createdBy instanceof Types.ObjectId) {
            return {
                id: createdBy.toString(),
            };
        }

        return {
            id: createdBy._id?.toString(),
            name: createdBy.name,
            email: createdBy.email,
        };
    }

    private scoreRecommendation(
        item: RecommendationCandidateRecord,
        categoryAffinities: Map<string, number>,
        userId: string,
    ): ActivityRecommendationItem {
        const categoryKey = item.categoryId?._id ? String(item.categoryId._id) : '';
        const categoryCount = categoryAffinities.get(categoryKey) || 0;

        const categoryScore = Math.min(categoryCount * 8, 24);
        const cohortScore = Math.min((item.cohortCount || 0) * 2, 20);
        const popularityScore = Math.min((item.participantCount || 0) / 5, 12);
        const trainingScore = Math.min((item.trainingScore || 0) / 5, 12);

        const startDate = new Date(item.startAt);
        const daysUntilStart = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const freshnessScore = daysUntilStart <= 7 ? 12 : daysUntilStart <= 30 ? 8 : 4;
        const priorityBoost = item.isPriority ? 8 : 0;

        const rawScore =
            categoryScore +
            cohortScore +
            popularityScore +
            trainingScore +
            freshnessScore +
            priorityBoost;

        const matchScore = Math.min(Math.round(rawScore), 100);

        let reason = 'Phù hợp với lịch hoạt động gần đây của bạn';
        const strongestSignal = [
            { key: 'category', value: categoryScore },
            { key: 'cohort', value: cohortScore },
            { key: 'freshness', value: freshnessScore },
        ].sort((a, b) => b.value - a.value)[0]?.key;

        if (strongestSignal === 'category' && categoryCount > 0) {
            reason = `Phù hợp với sở thích danh mục ${item.categoryId?.name || ''}`.trim();
        } else if (strongestSignal === 'cohort' && item.cohortCount > 0) {
            reason = 'Được sinh viên cùng lớp/khoa quan tâm';
        } else if (strongestSignal === 'freshness') {
            reason = 'Sắp diễn ra, phù hợp để đăng ký ngay';
        }

        return {
            id: item._id.toString(),
            isMine: Boolean(item.createdBy?.toString() === userId),
            title: item.title,
            description: item.description,
            image: item.image,
            location: item.location,
            status: item.status,
            startAt: item.startAt,
            endAt: item.endAt,
            trainingScore: item.trainingScore,
            participantCount: item.participantCount,
            organizerId: item.organizerId,
            categoryId: item.categoryId,
            averageRating: item.averageRating,
            matchScore,
            reason,
            isPriority: item.isPriority,
        };
    }

    private async notifyCreatorOnReview(
        activity: Activity,
        approvalStatus: ActivityApprovalValue,
        reviewNote?: string,
        notifyOrganizer?: boolean,
    ): Promise<void> {
        if (notifyOrganizer === false) {
            return;
        }

        if (
            ![
                ACTIVITY_APPROVAL_STATUS.APPROVED,
                ACTIVITY_APPROVAL_STATUS.NEEDS_EDIT,
                ACTIVITY_APPROVAL_STATUS.REJECTED,
            ].includes(approvalStatus)
        ) {
            return;
        }

        const creatorId = activity.createdBy?.toString();
        if (!creatorId) {
            return;
        }

        const activityId = ((activity as Activity & { _id?: Types.ObjectId })._id)?.toString();
        if (!activityId) {
            return;
        }

        const notificationContent = this.buildReviewNotificationContent(activity.title, approvalStatus, reviewNote);

        try {
            await this.notificationService.create({
                userId: creatorId,
                senderName: 'Hệ thống phê duyệt hoạt động',
                senderType: 'system',
                title: notificationContent.title,
                message: notificationContent.message,
                type: NotificationType.ACTIVITY,
                priority: notificationContent.priority,
                linkUrl: `/detail/${activityId}`,
                groupKey: `activity-review:${activityId}`,
                meta: {
                    activityId,
                    activityTitle: activity.title,
                    approvalStatus,
                    reviewNote: reviewNote || null,
                },
            });
        } catch (error) {
            this.logger.error(
                `Không thể tạo thông báo duyệt hoạt động cho activity ${activityId}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    private buildReviewNotificationContent(
        activityTitle: string,
        approvalStatus: ActivityApprovalValue,
        reviewNote?: string,
    ): { title: string; message: string; priority: NotificationPriority } {
        const normalizedReviewNote = reviewNote?.trim();

        if (approvalStatus === ACTIVITY_APPROVAL_STATUS.NEEDS_EDIT) {
            return {
                title: 'Hoạt động cần chỉnh sửa trước khi duyệt',
                message: normalizedReviewNote
                    ? `Hoạt động "${activityTitle}" đã được admin phản hồi và yêu cầu chỉnh sửa. Ghi chú: ${normalizedReviewNote}`
                    : `Hoạt động "${activityTitle}" đã được admin phản hồi và yêu cầu chỉnh sửa. Vui lòng mở chi tiết để xem thêm.`,
                priority: NotificationPriority.HIGH,
            };
        }

        if (approvalStatus === ACTIVITY_APPROVAL_STATUS.APPROVED) {
            return {
                title: 'Hoạt động đã được duyệt',
                message: normalizedReviewNote
                    ? `Hoạt động "${activityTitle}" đã được admin duyệt. Ghi chú: ${normalizedReviewNote}`
                    : `Hoạt động "${activityTitle}" đã được admin duyệt và hiện đã sẵn sàng công khai.`,
                priority: NotificationPriority.NORMAL,
            };
        }

        return {
            title: 'Hoạt động đã bị từ chối',
            message: normalizedReviewNote
                ? `Hoạt động "${activityTitle}" đã bị từ chối. Lý do: ${normalizedReviewNote}`
                : `Hoạt động "${activityTitle}" đã bị từ chối. Vui lòng mở chi tiết để xem thêm.`,
            priority: NotificationPriority.URGENT,
        };
    }
}