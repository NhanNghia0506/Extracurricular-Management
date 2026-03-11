import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import {
    ActivityApprovalRecord,
    ActivityNamedReference,
    ActivityRepository,
    ActivityUserReference,
} from './activity.repository';
import { CreateActivityDto } from './dtos/create.activity.dto';
import { UpdateActivityDto } from './dtos/update.activity.dto';
import { Types } from 'mongoose';
import { ActivityStatus, UserRole } from '../../global/globalEnum';
import { Activity } from './activity.entity';
import {
    ActivityApprovalDashboardResponse,
    ActivityApprovalDetailResponse,
    ActivityApprovalListItemResponse,
    ActivityApprovalStatsResponse,
    ActivityDetailResponse,
} from 'src/global/globalInterface';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { UploadService } from '../../interceptors/upload.service';

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


@Injectable()
export class ActivityService {
    private static readonly DELETE_NOTICE_PERIOD_IN_MS = 2 * 24 * 60 * 60 * 1000;

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
        const isRegistered = userId ? await this.activityParticipantService.findByActivityAndUserId(id, userId) !== null : false;
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
}