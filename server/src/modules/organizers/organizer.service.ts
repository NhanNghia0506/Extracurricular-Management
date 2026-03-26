import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { OrganizerApprovalRecord, OrganizerRepository, OrganizerUserReference } from "./organizer.repository";
import { CreateOrganizerDto } from "./dtos/create.organizer.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { OrganizerMemberService } from "../organizer-members/organizer-member.service";
import { ActivityApprovalStatus, CheckinStatus, NotificationPriority, NotificationType, OrganizerApprovalStatus, OrganizerMemberRole, UserRole } from "src/global/globalEnum";
import {
    OrganizerApprovalDashboardResponse,
    OrganizerApprovalDetailResponse,
    OrganizerApprovalListItemResponse,
    OrganizerApprovalStatsResponse,
} from "src/global/globalInterface";
import { NotificationService } from "../notifications/notification.service";
import { OrganizerApprovalQueryDto } from "./dtos/organizer-approval-query.dto";
import { UpdateOrganizerApprovalDto } from "./dtos/update-organizer-approval.dto";
import { UpdateOrganizerDto } from "./dtos/update.organizer.dto";
import { Organizer } from "./organizer.entity";
import { Activity, ActivityDocument } from "../activities/activity.entity";
import { ActivityParticipant, ParticipantStatus } from "../activity-participants/activity-participant.entity";
import { CheckinSession } from "../checkin-sessions/checkin-session.entity";
import { Checkin } from "../checkins/checkin.entity";
import { UploadService } from "src/interceptors/upload.service";

type OrganizerApprovalValue = OrganizerApprovalStatus;

const ORGANIZER_APPROVAL_STATUS: Record<'PENDING' | 'NEEDS_EDIT' | 'APPROVED' | 'REJECTED', OrganizerApprovalValue> = {
    PENDING: OrganizerApprovalStatus.PENDING,
    NEEDS_EDIT: OrganizerApprovalStatus.NEEDS_EDIT,
    APPROVED: OrganizerApprovalStatus.APPROVED,
    REJECTED: OrganizerApprovalStatus.REJECTED,
};

@Injectable()
export class OrganizerService {
    private readonly logger = new Logger(OrganizerService.name);

    constructor(
        private readonly organizerRepository: OrganizerRepository,
        private readonly organizerMemberService: OrganizerMemberService,
        private readonly notificationService: NotificationService,
        private readonly uploadService: UploadService,
        @InjectModel(Organizer.name)
        private readonly organizerModel: Model<Organizer>,
        @InjectModel(Activity.name)
        private readonly activityModel: Model<ActivityDocument>,
        @InjectModel(ActivityParticipant.name)
        private readonly activityParticipantModel: Model<ActivityParticipant>,
        @InjectModel(CheckinSession.name)
        private readonly checkinSessionModel: Model<CheckinSession>,
        @InjectModel(Checkin.name)
        private readonly checkinModel: Model<Checkin>,
    ) { }

    async create(createdBy: string, organizerData: CreateOrganizerDto) {
        const description = typeof organizerData.description === 'string'
            ? organizerData.description.trim()
            : '';

        const organizer = {
            name: organizerData.name,
            email: organizerData.email,
            phone: organizerData.phone,
            description,
            image: organizerData.image,
            createdBy: new Types.ObjectId(createdBy),
            approvalStatus: OrganizerApprovalStatus.PENDING,
        };

        const createdOrganizer = await this.organizerRepository.create(organizer);

        await this.organizerMemberService.create({
            userId: createdBy,
            organizerId: createdOrganizer._id.toString(),
            role: OrganizerMemberRole.MANAGER,
            isActive: true,
        });

        return createdOrganizer;
    }

    findAll() {
        return this.organizerRepository.findAll();
    }

    findById(id: string) {
        return this.organizerRepository.findById(id);
    }

    async getOrganizerOverview(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        const organizerId = new Types.ObjectId(id);
        const organizer = await this.organizerModel.findById(organizerId).lean();

        if (!organizer) {
            throw new NotFoundException('Không tìm thấy ban tổ chức với ID đã cho');
        }

        const approvedActivities = await this.activityModel
            .find(
                {
                    organizerId,
                    approvalStatus: ActivityApprovalStatus.APPROVED,
                },
                {
                    _id: 1,
                    title: 1,
                    image: 1,
                    startAt: 1,
                    endAt: 1,
                    status: 1,
                    createdAt: 1,
                },
            )
            .sort({ createdAt: -1 })
            .lean();

        const activityIds = approvedActivities.map((item) => item._id as Types.ObjectId);

        if (activityIds.length === 0) {
            return {
                organizer: {
                    id: organizer._id.toString(),
                    name: organizer.name,
                    email: organizer.email,
                    phone: organizer.phone,
                    description: organizer.description || '',
                    image: organizer.image || '',
                    createdAt: organizer.createdAt || null,
                },
                stats: {
                    activityCount: 0,
                    totalParticipants: 0,
                    averageAttendanceRate: 0,
                },
                recentActivities: [],
            };
        }

        const participantSummaryRaw = await this.activityParticipantModel.aggregate<{
            _id: Types.ObjectId;
            registered: number;
        }>([
            {
                $match: {
                    activityId: { $in: activityIds },
                    status: { $ne: ParticipantStatus.CANCELLED },
                },
            },
            {
                $group: {
                    _id: '$activityId',
                    registered: { $sum: 1 },
                },
            },
        ]);

        const attendanceSummaryRaw = await this.checkinSessionModel.aggregate<{
            _id: Types.ObjectId;
            attended: number;
        }>([
            {
                $match: {
                    activityId: { $in: activityIds },
                },
            },
            {
                $lookup: {
                    from: this.checkinModel.collection.name,
                    localField: '_id',
                    foreignField: 'checkinSessionId',
                    as: 'checkins',
                },
            },
            {
                $unwind: {
                    path: '$checkins',
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $match: {
                    'checkins.status': {
                        $in: [CheckinStatus.SUCCESS, CheckinStatus.LATE],
                    },
                },
            },
            {
                $group: {
                    _id: {
                        activityId: '$activityId',
                        userId: '$checkins.userId',
                    },
                },
            },
            {
                $group: {
                    _id: '$_id.activityId',
                    attended: { $sum: 1 },
                },
            },
        ]);

        const participantSummary = new Map(
            participantSummaryRaw.map((item) => [item._id.toString(), item.registered]),
        );
        const attendanceSummary = new Map(
            attendanceSummaryRaw.map((item) => [item._id.toString(), item.attended]),
        );

        const totalParticipants = participantSummaryRaw.reduce((sum, item) => sum + item.registered, 0);

        let totalRate = 0;
        let rateSamples = 0;

        for (const activity of approvedActivities) {
            const key = activity._id.toString();
            const registered = participantSummary.get(key) ?? 0;
            if (registered <= 0) {
                continue;
            }

            const attended = attendanceSummary.get(key) ?? 0;
            totalRate += (attended / registered) * 100;
            rateSamples += 1;
        }

        const averageAttendanceRate = rateSamples > 0
            ? Number((totalRate / rateSamples).toFixed(1))
            : 0;

        return {
            organizer: {
                id: organizer._id.toString(),
                name: organizer.name,
                email: organizer.email,
                phone: organizer.phone,
                description: organizer.description || '',
                image: organizer.image || '',
                createdAt: organizer.createdAt || null,
            },
            stats: {
                activityCount: approvedActivities.length,
                totalParticipants,
                averageAttendanceRate,
            },
            recentActivities: approvedActivities.slice(0, 6).map((activity) => ({
                id: activity._id.toString(),
                title: activity.title,
                image: activity.image || '',
                startAt: activity.startAt,
                endAt: activity.endAt || null,
                status: activity.status,
                participantCount: participantSummary.get(activity._id.toString()) ?? 0,
                attendanceRate: (() => {
                    const registered = participantSummary.get(activity._id.toString()) ?? 0;
                    if (registered <= 0) {
                        return 0;
                    }
                    const attended = attendanceSummary.get(activity._id.toString()) ?? 0;
                    return Number(((attended / registered) * 100).toFixed(1));
                })(),
            })),
        };
    }

    async updateOrganizerByManager(id: string, actorUserId: string, organizerData: UpdateOrganizerDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        const currentOrganizer = await this.organizerRepository.findById(id);
        if (!currentOrganizer) {
            throw new NotFoundException('Không tìm thấy ban tổ chức với ID đã cho');
        }

        const actorMember = await this.organizerMemberService.findByUserIdAndOrganizerId(actorUserId, id);
        if (!actorMember || !actorMember.isActive) {
            throw new ForbiddenException('Bạn không thuộc tổ chức này');
        }

        if (actorMember.role !== OrganizerMemberRole.MANAGER) {
            throw new ForbiddenException('Chỉ manager của tổ chức mới có quyền cập nhật thông tin ban tổ chức');
        }

        const payload: Partial<Organizer> = {};

        if (typeof organizerData.name === 'string') {
            payload.name = organizerData.name.trim();
        }

        if (typeof organizerData.email === 'string') {
            payload.email = organizerData.email.trim();
        }

        if (typeof organizerData.phone === 'string') {
            payload.phone = organizerData.phone.trim();
        }

        if (typeof organizerData.description === 'string') {
            payload.description = organizerData.description.trim();
        }

        if (typeof organizerData.image === 'string' && organizerData.image.trim()) {
            payload.image = organizerData.image.trim();
        }

        const updatedOrganizer = await this.organizerRepository.update(id, payload);
        if (!updatedOrganizer) {
            throw new NotFoundException('Lỗi khi cập nhật ban tổ chức');
        }

        if (
            payload.image &&
            typeof currentOrganizer.image === 'string' &&
            currentOrganizer.image &&
            currentOrganizer.image !== payload.image
        ) {
            try {
                this.uploadService.deleteFile(currentOrganizer.image);
            } catch {
                // Do not fail update flow when old image cleanup fails.
            }
        }

        return updatedOrganizer;
    }

    delete(id: string) {
        return this.organizerRepository.delete(id);
    }

    async getApprovalDashboard(
        userRole: string | undefined,
        query: OrganizerApprovalQueryDto,
    ): Promise<OrganizerApprovalDashboardResponse> {
        this.ensureSystemAdmin(userRole);

        const [items, stats] = await Promise.all([
            this.findAllApprovalRecords(query.approvalStatus),
            this.getApprovalStats(userRole),
        ]);

        return {
            items: items.map((organizer) => this.mapApprovalListItem(organizer)),
            stats,
        };
    }

    async getApprovalDetail(id: string, userRole: string | undefined): Promise<OrganizerApprovalDetailResponse> {
        this.ensureSystemAdmin(userRole);

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        const organizer = await this.findApprovalRecordById(id);
        if (!organizer) {
            throw new NotFoundException('Không tìm thấy ban tổ chức với ID đã cho');
        }

        const baseItem = this.mapApprovalListItem(organizer);

        return {
            ...baseItem,
            reviewedAt: organizer.reviewedAt || null,
            reviewedBy: this.extractUserReference(organizer.reviewedBy),
        };
    }

    async reviewOrganizer(
        id: string,
        adminId: string,
        userRole: string | undefined,
        reviewDto: UpdateOrganizerApprovalDto,
    ): Promise<OrganizerApprovalDetailResponse> {
        this.ensureSystemAdmin(userRole);

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID phải là MongoDB ObjectId hợp lệ');
        }

        if (!Types.ObjectId.isValid(adminId)) {
            throw new BadRequestException('adminId phải là MongoDB ObjectId hợp lệ');
        }

        const organizer = await this.organizerRepository.findById(id);
        if (!organizer) {
            throw new NotFoundException('Không tìm thấy ban tổ chức với ID đã cho');
        }

        const approvalStatus = reviewDto.approvalStatus;
        const reviewNote = reviewDto.reviewNote?.trim();
        const isPriority = reviewDto.isPriority ?? organizer.isPriority ?? false;

        if (
            [ORGANIZER_APPROVAL_STATUS.NEEDS_EDIT, ORGANIZER_APPROVAL_STATUS.REJECTED].includes(approvalStatus) &&
            !reviewNote
        ) {
            throw new BadRequestException('Cần nhập ghi chú phản hồi khi yêu cầu chỉnh sửa hoặc từ chối');
        }

        const updatedOrganizer = await this.organizerRepository.update(id, {
            approvalStatus,
            reviewNote: reviewNote || null,
            reviewedBy: new Types.ObjectId(adminId),
            reviewedAt: new Date(),
            isPriority,
        });

        if (!updatedOrganizer) {
            throw new NotFoundException('Lỗi khi cập nhật trạng thái duyệt ban tổ chức');
        }

        await this.notifyCreatorOnReview(organizer, approvalStatus, reviewNote, reviewDto.notifyOrganizer);

        return this.getApprovalDetail(id, userRole);
    }

    async getApprovalStats(userRole: string | undefined): Promise<OrganizerApprovalStatsResponse> {
        this.ensureSystemAdmin(userRole);

        const [pending, approved, needsEdit, rejected, overdueItems] = await Promise.all([
            this.countByApprovalStatus(ORGANIZER_APPROVAL_STATUS.PENDING),
            this.countByApprovalStatus(ORGANIZER_APPROVAL_STATUS.APPROVED),
            this.countByApprovalStatus(ORGANIZER_APPROVAL_STATUS.NEEDS_EDIT),
            this.countByApprovalStatus(ORGANIZER_APPROVAL_STATUS.REJECTED),
            this.findAllApprovalRecords(ORGANIZER_APPROVAL_STATUS.PENDING),
        ]);

        return {
            pending,
            approved,
            needsEdit,
            rejected,
            overdue: overdueItems.filter((organizer) => this.getWarningTag(organizer) !== null).length,
        };
    }

    private ensureSystemAdmin(userRole?: string): void {
        if (userRole !== UserRole.ADMIN) {
            throw new ForbiddenException('Chỉ admin hệ thống mới có quyền thực hiện thao tác này');
        }
    }

    private mapApprovalListItem(organizer: OrganizerApprovalRecord): OrganizerApprovalListItemResponse {
        const description = typeof organizer.description === 'string' ? organizer.description : '';

        return {
            id: organizer._id.toString(),
            code: `ORG-${organizer._id.toString().slice(-6).toUpperCase()}`,
            name: organizer.name,
            image: organizer.image,
            email: organizer.email,
            phone: organizer.phone,
            description,
            createdBy: this.extractRequiredUserReference(organizer.createdBy),
            createdAt: organizer.createdAt,
            updatedAt: organizer.updatedAt,
            approvalStatus: organizer.approvalStatus,
            isPriority: Boolean(organizer.isPriority),
            reviewNote: organizer.reviewNote || null,
            warningTag: this.getWarningTag(organizer),
        };
    }

    private getWarningTag(organizer: Pick<OrganizerApprovalRecord, 'approvalStatus' | 'createdAt'>): string | null {
        if (organizer.approvalStatus === ORGANIZER_APPROVAL_STATUS.NEEDS_EDIT) {
            return 'Cần bổ sung thông tin';
        }

        if (organizer.approvalStatus === ORGANIZER_APPROVAL_STATUS.PENDING && organizer.createdAt) {
            const diffInDays = (Date.now() - new Date(organizer.createdAt).getTime()) / (24 * 60 * 60 * 1000);
            if (diffInDays >= 3) {
                return 'Chờ duyệt đã lâu';
            }
        }

        return null;
    }

    private extractRequiredUserReference(user: Types.ObjectId | OrganizerUserReference | null | undefined) {
        if (!user) {
            return {
                name: 'Chưa rõ người tạo',
            };
        }

        if (user instanceof Types.ObjectId) {
            return {
                id: user.toString(),
            };
        }

        return {
            id: user._id?.toString(),
            name: user.name,
            email: user.email,
        };
    }

    private extractUserReference(user: Types.ObjectId | OrganizerUserReference | null | undefined) {
        if (!user) {
            return null;
        }

        return this.extractRequiredUserReference(user);
    }

    private async findAllApprovalRecords(approvalStatus?: OrganizerApprovalValue): Promise<OrganizerApprovalRecord[]> {
        const repository = this.organizerRepository as {
            findAllForApproval: (value?: OrganizerApprovalValue) => Promise<OrganizerApprovalRecord[]>;
        };

        return repository.findAllForApproval(approvalStatus);
    }

    private async findApprovalRecordById(id: string): Promise<OrganizerApprovalRecord | null> {
        const repository = this.organizerRepository as {
            findApprovalById: (value: string) => Promise<OrganizerApprovalRecord | null>;
        };

        return repository.findApprovalById(id);
    }

    private async countByApprovalStatus(approvalStatus: OrganizerApprovalValue): Promise<number> {
        const repository = this.organizerRepository as {
            countByApprovalStatus: (value: OrganizerApprovalValue) => Promise<number>;
        };

        return repository.countByApprovalStatus(approvalStatus);
    }

    private async notifyCreatorOnReview(
        organizer: { _id?: Types.ObjectId; createdBy: Types.ObjectId; name: string },
        approvalStatus: OrganizerApprovalValue,
        reviewNote?: string,
        notifyOrganizer?: boolean,
    ): Promise<void> {
        if (notifyOrganizer === false) {
            return;
        }

        if (![ORGANIZER_APPROVAL_STATUS.APPROVED, ORGANIZER_APPROVAL_STATUS.NEEDS_EDIT, ORGANIZER_APPROVAL_STATUS.REJECTED].includes(approvalStatus)) {
            return;
        }

        const creatorId = organizer.createdBy?.toString();
        const organizerId = organizer._id?.toString();
        if (!creatorId || !organizerId) {
            return;
        }

        const content = this.buildReviewNotificationContent(organizer.name, approvalStatus, reviewNote);

        try {
            await this.notificationService.create({
                userId: creatorId,
                senderName: 'Quản trị duyệt ban tổ chức',
                senderType: 'organizer-review',
                title: content.title,
                message: content.message,
                type: 'ORGANIZER' as NotificationType,
                priority: content.priority,
                linkUrl: '/organizations',
                groupKey: `organizer-review:${organizerId}`,
                meta: {
                    organizerId,
                    organizerName: organizer.name,
                    approvalStatus,
                    reviewNote: reviewNote || null,
                },
            });
        } catch (error) {
            this.logger.error(
                `Không thể tạo thông báo duyệt ban tổ chức cho organizer ${organizerId}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    private buildReviewNotificationContent(
        organizerName: string,
        approvalStatus: OrganizerApprovalValue,
        reviewNote?: string,
    ): { title: string; message: string; priority: NotificationPriority } {
        const normalizedReviewNote = reviewNote?.trim();

        if (approvalStatus === ORGANIZER_APPROVAL_STATUS.NEEDS_EDIT) {
            return {
                title: 'Ban tổ chức cần bổ sung thông tin',
                message: normalizedReviewNote
                    ? `Ban tổ chức "${organizerName}" cần bổ sung thông tin. Ghi chú: ${normalizedReviewNote}`
                    : `Ban tổ chức "${organizerName}" cần bổ sung thông tin trước khi duyệt.`,
                priority: NotificationPriority.HIGH,
            };
        }

        if (approvalStatus === ORGANIZER_APPROVAL_STATUS.APPROVED) {
            return {
                title: 'Ban tổ chức đã được duyệt',
                message: normalizedReviewNote
                    ? `Ban tổ chức "${organizerName}" đã được duyệt. Ghi chú: ${normalizedReviewNote}`
                    : `Ban tổ chức "${organizerName}" đã được duyệt và có thể sử dụng trong hệ thống.`,
                priority: NotificationPriority.NORMAL,
            };
        }

        return {
            title: 'Ban tổ chức đã bị từ chối',
            message: normalizedReviewNote
                ? `Ban tổ chức "${organizerName}" đã bị từ chối. Lý do: ${normalizedReviewNote}`
                : `Ban tổ chức "${organizerName}" đã bị từ chối. Vui lòng xem lại thông tin đã gửi.`,
            priority: NotificationPriority.URGENT,
        };
    }
}
