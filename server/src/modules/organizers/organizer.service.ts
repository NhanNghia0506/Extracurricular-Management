import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { OrganizerApprovalRecord, OrganizerRepository, OrganizerUserReference } from "./organizer.repository";
import { CreateOrganizerDto } from "./dtos/create.organizer.dto";
import { Types } from "mongoose";
import { OrganizerMemberService } from "../organizer-members/organizer-member.service";
import { NotificationPriority, NotificationType, OrganizerApprovalStatus, OrganizerMemberRole, UserRole } from "src/global/globalEnum";
import {
    OrganizerApprovalDashboardResponse,
    OrganizerApprovalDetailResponse,
    OrganizerApprovalListItemResponse,
    OrganizerApprovalStatsResponse,
} from "src/global/globalInterface";
import { NotificationService } from "../notifications/notification.service";
import { OrganizerApprovalQueryDto } from "./dtos/organizer-approval-query.dto";
import { UpdateOrganizerApprovalDto } from "./dtos/update-organizer-approval.dto";

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

    update(id: string, organizerData: Partial<CreateOrganizerDto>) {
        return this.organizerRepository.update(id, organizerData);
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
