import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    ComplaintActorRole,
    ComplaintHistoryAction,
    ComplaintResolution,
    ComplaintStatus,
    NotificationType,
    UserRole,
} from 'src/global/globalEnum';
import { User } from '../users/user.entity';
import { ActivityService } from '../activities/activity.service';
import { CheckinSessionService } from '../checkin-sessions/checkin-session.service';
import { NotificationService } from '../notifications/notification.service';
import { OrganizerMemberService } from '../organizer-members/organizer-member.service';
import { ComplaintAttachment, ComplaintAttachmentDocument } from './complaint-attachment.entity';
import { ComplaintDocument } from './complaint.entity';
import { ComplaintHistory, ComplaintHistoryDocument } from './complaint-history.entity';
import { ComplaintRepository } from './complaint.repository';
import { ComplaintResponse, ComplaintResponseDocument } from './complaint-response.entity';
import { CreateComplaintResponseDto } from './dtos/create-complaint-response.dto';
import { CreateComplaintDto } from './dtos/create-complaint.dto';
import { ListComplaintsDto } from './dtos/list-complaints.dto';
import { ReviewComplaintDto } from './dtos/review-complaint.dto';

interface ComplaintAttachmentItem {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    createdAt?: Date;
}

interface ComplaintResponseItem {
    id: string;
    complaintId: string;
    senderId: string;
    senderName?: string;
    senderRole: ComplaintActorRole;
    message: string;
    attachments: ComplaintAttachmentItem[];
    createdAt?: Date;
    updatedAt?: Date;
}

interface ComplaintHistoryItem {
    id: string;
    complaintId: string;
    action: ComplaintHistoryAction;
    actorId?: string | null;
    actorName?: string;
    actorRole: ComplaintActorRole;
    fromStatus?: ComplaintStatus | null;
    toStatus?: ComplaintStatus | null;
    note?: string | null;
    meta?: Record<string, unknown> | null;
    createdAt?: Date;
}

interface ComplaintListItem {
    id: string;
    complainantId: string;
    complainantName?: string;
    targetEntityId: string;
    targetEntityName: string;
    title: string;
    description: string;
    attachmentUrls: string[];
    attachments: ComplaintAttachmentItem[];
    status: ComplaintStatus;
    resolution?: ComplaintResolution | null;
    reviewNote?: string | null;
    reviewedBy?: {
        id: string;
        name?: string;
    } | null;
    reviewedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ComplaintListResponse {
    items: ComplaintListItem[];
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

interface ComplaintDashboardResponse {
    submitted: number;
    underReview: number;
    resolved: number;
    closed: number;
}

interface UserNameRow {
    _id: Types.ObjectId;
    name?: string;
}

interface AttachmentLeanRow {
    _id: Types.ObjectId;
    responseId?: Types.ObjectId | null;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    createdAt?: Date;
}

interface ComplaintResponseLeanRow {
    _id: Types.ObjectId;
    complaintId: Types.ObjectId;
    senderId: Types.ObjectId;
    senderRole: ComplaintActorRole;
    message: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ComplaintHistoryLeanRow {
    _id: Types.ObjectId;
    complaintId: Types.ObjectId;
    action: ComplaintHistoryAction;
    actorId?: Types.ObjectId | null;
    actorRole: ComplaintActorRole;
    fromStatus?: ComplaintStatus | null;
    toStatus?: ComplaintStatus | null;
    note?: string | null;
    meta?: Record<string, unknown> | null;
    createdAt?: Date;
}

@Injectable()
export class ComplaintService {
    constructor(
        private readonly complaintRepository: ComplaintRepository,
        private readonly activityService: ActivityService,
        private readonly checkinSessionService: CheckinSessionService,
        private readonly notificationService: NotificationService,
        private readonly organizerMemberService: OrganizerMemberService,
        @InjectModel(ComplaintResponse.name)
        private readonly complaintResponseModel: Model<ComplaintResponseDocument>,
        @InjectModel(ComplaintAttachment.name)
        private readonly complaintAttachmentModel: Model<ComplaintAttachmentDocument>,
        @InjectModel(ComplaintHistory.name)
        private readonly complaintHistoryModel: Model<ComplaintHistoryDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<User>,
    ) { }

    async create(
        payload: CreateComplaintDto,
        complainantId: string,
    ): Promise<ComplaintListItem> {
        this.ensureObjectId(payload.targetEntityId, 'targetEntityId phải là MongoDB ObjectId hợp lệ');
        this.ensureObjectId(complainantId, 'userId phải là MongoDB ObjectId hợp lệ');

        const targetName = await this.getTargetEntityName(payload.targetEntityId);

        const existingOpen = await this.complaintRepository.findOpenByTargetAndComplainant(
            complainantId,
            payload.targetEntityId,
        );

        if (existingOpen) {
            throw new ConflictException('Bạn đã có khiếu nại đang xử lý cho nội dung này');
        }

        const created = await this.complaintRepository.create({
            complainantId,
            targetEntityId: payload.targetEntityId,
            title: payload.title.trim(),
            description: payload.description.trim(),
            attachmentUrls: (payload.attachmentUrls || []).map((item) => item.trim()).filter(Boolean),
        });

        await this.createAttachmentRows(
            created._id.toString(),
            complainantId,
            (payload.attachmentUrls || []).map((item) => item.trim()).filter(Boolean),
        );

        await this.createHistoryRecord({
            complaintId: created._id.toString(),
            action: ComplaintHistoryAction.CREATED,
            actorId: complainantId,
            actorRole: ComplaintActorRole.STUDENT,
            toStatus: created.status,
            note: 'Sinh viên tạo khiếu nại mới',
        });

        if ((payload.attachmentUrls || []).length) {
            await this.createHistoryRecord({
                complaintId: created._id.toString(),
                action: ComplaintHistoryAction.ATTACHMENT_ADDED,
                actorId: complainantId,
                actorRole: ComplaintActorRole.STUDENT,
                toStatus: created.status,
                note: `Đính kèm ${(payload.attachmentUrls || []).length} file bằng chứng`,
            });
        }

        await this.notifyAdminsOnCreated(created, targetName);

        return this.toResponse(created, targetName);
    }

    async listMine(currentUserId: string, query: ListComplaintsDto): Promise<ComplaintListResponse> {
        this.ensureObjectId(currentUserId, 'userId phải là MongoDB ObjectId hợp lệ');

        const limit = query.limit ?? 10;
        const skip = query.skip ?? 0;

        const [total, rows] = await Promise.all([
            this.complaintRepository.countAll({
                complainantId: currentUserId,
                status: query.status,
            }),
            this.complaintRepository.findAll(
                {
                    complainantId: currentUserId,
                    status: query.status,
                },
                limit,
                skip,
            ),
        ]);

        const items = await this.mapRowsToResponse(rows);

        return {
            items,
            total,
            limit,
            skip,
            hasMore: skip + items.length < total,
        };
    }

    async getMineById(id: string, currentUserId: string): Promise<ComplaintListItem> {
        this.ensureObjectId(id, 'complaintId phải là MongoDB ObjectId hợp lệ');
        this.ensureObjectId(currentUserId, 'userId phải là MongoDB ObjectId hợp lệ');

        const complaint = await this.complaintRepository.findById(id);
        if (!complaint) {
            throw new NotFoundException('Không tìm thấy khiếu nại');
        }

        if (complaint.complainantId.toString() !== currentUserId) {
            throw new ForbiddenException('Bạn không có quyền xem khiếu nại này');
        }

        return this.toResponse(
            complaint,
            await this.getTargetEntityName(complaint.targetEntityId.toString()),
        );
    }

    async listMineResponses(id: string, currentUserId: string): Promise<ComplaintResponseItem[]> {
        const complaint = await this.assertMineComplaint(id, currentUserId);
        return this.listResponsesInternal(complaint._id.toString());
    }

    async addMineResponse(
        id: string,
        currentUserId: string,
        payload: CreateComplaintResponseDto,
    ): Promise<ComplaintResponseItem> {
        const complaint = await this.assertMineComplaint(id, currentUserId);
        const created = await this.complaintResponseModel.create({
            complaintId: complaint._id,
            senderId: new Types.ObjectId(currentUserId),
            senderRole: ComplaintActorRole.STUDENT,
            message: payload.message.trim(),
        });

        await this.createAttachmentRows(
            complaint._id.toString(),
            currentUserId,
            (payload.attachmentUrls || []).map((item) => item.trim()).filter(Boolean),
            created._id.toString(),
        );

        await this.createHistoryRecord({
            complaintId: complaint._id.toString(),
            action: ComplaintHistoryAction.RESPONSE_ADDED,
            actorId: currentUserId,
            actorRole: ComplaintActorRole.STUDENT,
            fromStatus: complaint.status,
            toStatus: complaint.status,
            note: 'Sinh viên phản hồi trong luồng khiếu nại',
        });

        return this.toResponseMessage(created);
    }

    async listMineHistory(id: string, currentUserId: string): Promise<ComplaintHistoryItem[]> {
        const complaint = await this.assertMineComplaint(id, currentUserId);
        return this.listHistoryInternal(complaint._id.toString());
    }

    async listAdmin(query: ListComplaintsDto, actorUserId?: string): Promise<ComplaintListResponse> {
        const limit = query.limit ?? 10;
        const skip = query.skip ?? 0;
        if (!query.organizerId) {
            throw new ForbiddenException('Bạn chỉ có thể xem khiếu nại trong phạm vi tổ chức của mình');
        }

        const targetEntityIds = await this.getTargetEntityIdsForOrganizer(query.organizerId, actorUserId);

        const [total, rows] = await Promise.all([
            this.complaintRepository.countAll({
                status: query.status,
                targetEntityIds,
            }),
            this.complaintRepository.findAll(
                {
                    status: query.status,
                    targetEntityIds,
                },
                limit,
                skip,
            ),
        ]);

        const items = await this.mapRowsToResponse(rows);

        return {
            items,
            total,
            limit,
            skip,
            hasMore: skip + items.length < total,
        };
    }

    async getAdminById(id: string, actorUserId?: string, organizerId?: string): Promise<ComplaintListItem> {
        this.ensureObjectId(id, 'complaintId phải là MongoDB ObjectId hợp lệ');

        const complaint = await this.complaintRepository.findById(id);
        if (!complaint) {
            throw new NotFoundException('Không tìm thấy khiếu nại');
        }

        await this.assertCanManageComplaint(complaint, actorUserId, organizerId);

        return this.toResponse(
            complaint,
            await this.getTargetEntityName(complaint.targetEntityId.toString()),
        );
    }

    async listAdminResponses(id: string, actorUserId?: string, organizerId?: string): Promise<ComplaintResponseItem[]> {
        const complaint = await this.assertComplaintForManagerScope(id, actorUserId, organizerId);
        return this.listResponsesInternal(complaint._id.toString());
    }

    async addAdminResponse(
        id: string,
        adminId: string,
        organizerId: string | undefined,
        payload: CreateComplaintResponseDto,
    ): Promise<ComplaintResponseItem> {
        const complaint = await this.assertComplaintForManagerScope(id, adminId, organizerId);
        await this.assertCanManageComplaint(complaint, adminId, organizerId);

        const created = await this.complaintResponseModel.create({
            complaintId: complaint._id,
            senderId: new Types.ObjectId(adminId),
            senderRole: ComplaintActorRole.ADMIN,
            message: payload.message.trim(),
        });

        await this.createAttachmentRows(
            complaint._id.toString(),
            adminId,
            (payload.attachmentUrls || []).map((item) => item.trim()).filter(Boolean),
            created._id.toString(),
        );

        await this.createHistoryRecord({
            complaintId: complaint._id.toString(),
            action: ComplaintHistoryAction.RESPONSE_ADDED,
            actorId: adminId,
            actorRole: ComplaintActorRole.ADMIN,
            fromStatus: complaint.status,
            toStatus: complaint.status,
            note: 'Admin phản hồi cho khiếu nại',
        });

        return this.toResponseMessage(created);
    }

    async listAdminHistory(id: string, actorUserId?: string, organizerId?: string): Promise<ComplaintHistoryItem[]> {
        const complaint = await this.assertComplaintForManagerScope(id, actorUserId, organizerId);
        return this.listHistoryInternal(complaint._id.toString());
    }

    async review(
        id: string,
        reviewerId: string,
        organizerId: string | undefined,
        payload: ReviewComplaintDto,
    ): Promise<ComplaintListItem> {
        this.ensureObjectId(id, 'complaintId phải là MongoDB ObjectId hợp lệ');
        this.ensureObjectId(reviewerId, 'reviewerId phải là MongoDB ObjectId hợp lệ');

        const existing = await this.complaintRepository.findById(id);
        if (!existing) {
            throw new NotFoundException('Không tìm thấy khiếu nại');
        }

        await this.assertCanManageComplaint(existing, reviewerId, organizerId);

        if (![ComplaintStatus.UNDER_REVIEW, ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED].includes(payload.status)) {
            throw new BadRequestException('Trạng thái xử lý không hợp lệ cho thao tác review');
        }

        if (
            [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED].includes(payload.status)
            && !payload.resolution
        ) {
            throw new BadRequestException('Cần cung cấp kết quả xử lý khi kết thúc khiếu nại');
        }

        const updated = await this.complaintRepository.updateReview(id, {
            status: payload.status,
            resolution: payload.resolution ?? null,
            reviewNote: payload.reviewNote.trim(),
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
        });

        if (!updated) {
            throw new NotFoundException('Không tìm thấy khiếu nại');
        }

        await this.createHistoryRecord({
            complaintId: updated._id.toString(),
            action: ComplaintHistoryAction.STATUS_CHANGED,
            actorId: reviewerId,
            actorRole: ComplaintActorRole.ADMIN,
            fromStatus: existing.status,
            toStatus: updated.status,
            note: payload.reviewNote.trim(),
            meta: {
                resolution: payload.resolution ?? null,
            },
        });

        await this.notifyComplainantOnReviewed(updated);

        return this.toResponse(
            updated,
            await this.getTargetEntityName(updated.targetEntityId.toString()),
        );
    }

    async getDashboard(actorUserId?: string, organizerId?: string): Promise<ComplaintDashboardResponse> {
        if (!organizerId) {
            throw new ForbiddenException('Bạn chỉ có thể xem dashboard khiếu nại trong phạm vi tổ chức của mình');
        }

        const targetEntityIds = await this.getTargetEntityIdsForOrganizer(organizerId, actorUserId);

        const [submitted, underReview, resolved, closed] = await Promise.all([
            this.complaintRepository.countAll({ status: ComplaintStatus.SUBMITTED, targetEntityIds }),
            this.complaintRepository.countAll({ status: ComplaintStatus.UNDER_REVIEW, targetEntityIds }),
            this.complaintRepository.countAll({ status: ComplaintStatus.RESOLVED, targetEntityIds }),
            this.complaintRepository.countAll({ status: ComplaintStatus.CLOSED, targetEntityIds }),
        ]);

        return {
            submitted,
            underReview,
            resolved,
            closed,
        };
    }

    private ensureObjectId(value: string, message: string): void {
        if (!Types.ObjectId.isValid(value)) {
            throw new BadRequestException(message);
        }
    }

    private async getTargetEntityIdsForOrganizer(
        organizerId: string,
        actorUserId?: string,
    ): Promise<string[]> {
        this.ensureObjectId(organizerId, 'organizerId phải là MongoDB ObjectId hợp lệ');

        if (!actorUserId) {
            throw new ForbiddenException('Bạn không có quyền xử lý khiếu nại của tổ chức này');
        }

        await this.assertOrganizerManager(organizerId, actorUserId);

        const activityIds = await this.activityService.findIdsByOrganizerId(organizerId);
        if (!activityIds.length) {
            return [];
        }

        const sessionIds = await this.checkinSessionService.findIdsByActivityIds(activityIds);
        return [...activityIds, ...sessionIds];
    }

    private async assertOrganizerManager(organizerId: string, userId: string): Promise<void> {
        const member = await this.organizerMemberService.findByUserIdAndOrganizerId(userId, organizerId);
        if (!member || !member.isActive || String(member.role) !== 'MANAGER') {
            throw new ForbiddenException('Bạn không có quyền xử lý khiếu nại của tổ chức này');
        }
    }

    private async assertCanManageComplaint(
        complaint: ComplaintDocument,
        actorUserId?: string,
        organizerId?: string,
    ): Promise<void> {
        if (!actorUserId) {
            throw new ForbiddenException('Bạn không có quyền xử lý khiếu nại này');
        }

        if (!organizerId) {
            throw new ForbiddenException('Bạn chỉ có thể xử lý khiếu nại trong phạm vi tổ chức của mình');
        }

        const complaintOrganizerId = await this.getComplaintOrganizerId(complaint);
        if (complaintOrganizerId !== organizerId) {
            throw new ForbiddenException('Bạn không có quyền xử lý khiếu nại này');
        }

        if (!complaintOrganizerId) {
            throw new ForbiddenException('Không xác định được tổ chức của khiếu nại này');
        }

        await this.assertOrganizerManager(organizerId, actorUserId);
    }

    private async assertComplaintForManagerScope(
        id: string,
        actorUserId?: string,
        organizerId?: string,
    ): Promise<ComplaintDocument> {
        const complaint = await this.assertExistingComplaint(id);
        await this.assertCanManageComplaint(complaint, actorUserId, organizerId);
        return complaint;
    }

    private async getComplaintOrganizerId(complaint: ComplaintDocument): Promise<string | null> {
        const directActivity = await this.activityService.findById(complaint.targetEntityId.toString());
        if (directActivity?.organizerId) {
            return this.resolveOrganizerIdValue(directActivity.organizerId);
        }

        const activity = await this.checkinSessionService.findActivityBySessionId(complaint.targetEntityId.toString());
        if (!activity?.organizerId) {
            return null;
        }

        return this.resolveOrganizerIdValue(activity.organizerId);
    }

    private resolveOrganizerIdValue(value: unknown): string {
        if (typeof value === 'string') {
            return value;
        }

        if (value instanceof Types.ObjectId) {
            return value.toString();
        }

        if (value && typeof value === 'object' && '_id' in value) {
            const objectId = (value as { _id?: unknown })._id;
            if (typeof objectId === 'string') {
                return objectId;
            }

            if (objectId instanceof Types.ObjectId) {
                return objectId.toString();
            }
        }

        return String(value);
    }

    private async getTargetEntityName(targetEntityId: string): Promise<string> {
        const activity = await this.activityService.findById(targetEntityId);
        if (activity) {
            return activity.title;
        }

        const session = await this.checkinSessionService.findById(targetEntityId);
        if (!session) {
            throw new NotFoundException('Không tìm thấy phiên điểm danh để khiếu nại');
        }
        return session.title;
    }

    private async mapRowsToResponse(rows: ComplaintDocument[]): Promise<ComplaintListItem[]> {
        return Promise.all(
            rows.map(async (row) => this.toResponse(
                row,
                await this.getTargetEntityName(row.targetEntityId.toString()),
            )),
        );
    }

    private async toResponse(item: ComplaintDocument, targetEntityName: string): Promise<ComplaintListItem> {
        const complainantId = item.complainantId.toString();
        const reviewedById = item.reviewedBy ? item.reviewedBy.toString() : null;

        const users = await this.userModel.find({
            _id: { $in: [complainantId, ...(reviewedById ? [reviewedById] : [])] },
        }).select('_id name').lean<UserNameRow[]>();

        const attachmentRows = await this.complaintAttachmentModel
            .find({ complaintId: item._id, responseId: null })
            .sort({ createdAt: -1 })
            .lean<AttachmentLeanRow[]>();

        const attachments: ComplaintAttachmentItem[] = attachmentRows.map((row) => ({
            id: String(row._id),
            fileName: row.fileName,
            fileUrl: row.fileUrl,
            mimeType: row.mimeType,
            fileSize: row.fileSize,
            createdAt: row.createdAt,
        }));

        const userMap = new Map(users.map((user) => [String(user._id), user.name]));

        return {
            id: item._id.toString(),
            complainantId,
            complainantName: userMap.get(complainantId),
            targetEntityId: item.targetEntityId.toString(),
            targetEntityName,
            title: item.title,
            description: item.description,
            attachmentUrls: attachments.map((attachment) => attachment.fileUrl),
            attachments,
            status: item.status,
            resolution: item.resolution || null,
            reviewNote: item.reviewNote || null,
            reviewedBy: reviewedById
                ? {
                    id: reviewedById,
                    name: userMap.get(reviewedById),
                }
                : null,
            reviewedAt: item.reviewedAt || null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }

    private async assertExistingComplaint(id: string): Promise<ComplaintDocument> {
        this.ensureObjectId(id, 'complaintId phải là MongoDB ObjectId hợp lệ');
        const complaint = await this.complaintRepository.findById(id);
        if (!complaint) {
            throw new NotFoundException('Không tìm thấy khiếu nại');
        }
        return complaint;
    }

    private async assertMineComplaint(id: string, currentUserId: string): Promise<ComplaintDocument> {
        this.ensureObjectId(currentUserId, 'userId phải là MongoDB ObjectId hợp lệ');
        const complaint = await this.assertExistingComplaint(id);
        if (complaint.complainantId.toString() !== currentUserId) {
            throw new ForbiddenException('Bạn không có quyền thao tác khiếu nại này');
        }
        return complaint;
    }

    private async listResponsesInternal(complaintId: string): Promise<ComplaintResponseItem[]> {
        const rows = await this.complaintResponseModel
            .find({
                complaintId: new Types.ObjectId(complaintId),
            })
            .sort({ createdAt: 1 })
            .lean<ComplaintResponseLeanRow[]>();

        const senderIds = Array.from(new Set(rows.map((row) => String(row.senderId))));
        const users = senderIds.length
            ? await this.userModel.find({ _id: { $in: senderIds } }).select('_id name').lean<UserNameRow[]>()
            : [];
        const userMap = new Map(users.map((user) => [String(user._id), user.name]));

        const responseIds = rows.map((row) => row._id);
        const attachments = responseIds.length
            ? await this.complaintAttachmentModel
                .find({ responseId: { $in: responseIds } })
                .sort({ createdAt: 1 })
                .lean<AttachmentLeanRow[]>()
            : [];

        const attachmentMap = new Map<string, ComplaintAttachmentItem[]>();
        for (const row of attachments) {
            const key = String(row.responseId);
            const list = attachmentMap.get(key) || [];
            list.push({
                id: String(row._id),
                fileName: row.fileName,
                fileUrl: row.fileUrl,
                mimeType: row.mimeType,
                fileSize: row.fileSize,
                createdAt: row.createdAt,
            });
            attachmentMap.set(key, list);
        }

        return rows.map((row) => ({
            id: String(row._id),
            complaintId: String(row.complaintId),
            senderId: String(row.senderId),
            senderName: userMap.get(String(row.senderId)),
            senderRole: row.senderRole,
            message: row.message,
            attachments: attachmentMap.get(String(row._id)) || [],
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
    }

    private async toResponseMessage(row: ComplaintResponseDocument): Promise<ComplaintResponseItem> {
        const user = await this.userModel
            .findById(row.senderId)
            .select('_id name')
            .lean<UserNameRow | null>();

        const attachments = await this.complaintAttachmentModel
            .find({ responseId: row._id })
            .sort({ createdAt: 1 })
            .lean<AttachmentLeanRow[]>();

        return {
            id: row._id.toString(),
            complaintId: row.complaintId.toString(),
            senderId: row.senderId.toString(),
            senderName: user?.name,
            senderRole: row.senderRole,
            message: row.message,
            attachments: attachments.map((item) => ({
                id: String(item._id),
                fileName: item.fileName,
                fileUrl: item.fileUrl,
                mimeType: item.mimeType,
                fileSize: item.fileSize,
                createdAt: item.createdAt,
            })),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }

    private async listHistoryInternal(complaintId: string): Promise<ComplaintHistoryItem[]> {
        const rows = await this.complaintHistoryModel
            .find({ complaintId: new Types.ObjectId(complaintId) })
            .sort({ createdAt: -1 })
            .lean<ComplaintHistoryLeanRow[]>();

        const actorIds = Array.from(new Set(
            rows
                .map((row) => row.actorId ? String(row.actorId) : '')
                .filter(Boolean),
        ));

        const users = actorIds.length
            ? await this.userModel.find({ _id: { $in: actorIds } }).select('_id name').lean<UserNameRow[]>()
            : [];
        const userMap = new Map(users.map((user) => [String(user._id), user.name]));

        return rows.map((row) => ({
            id: String(row._id),
            complaintId: String(row.complaintId),
            action: row.action,
            actorId: row.actorId ? String(row.actorId) : null,
            actorName: row.actorId ? userMap.get(String(row.actorId)) : undefined,
            actorRole: row.actorRole,
            fromStatus: row.fromStatus || null,
            toStatus: row.toStatus || null,
            note: row.note || null,
            meta: row.meta || null,
            createdAt: row.createdAt,
        }));
    }

    private async createAttachmentRows(
        complaintId: string,
        uploadedBy: string,
        urls: string[],
        responseId?: string,
    ): Promise<void> {
        if (!urls.length) {
            return;
        }

        const rows = urls.map((fileUrl) => {
            const parts = fileUrl.split('/');
            const fallbackName = decodeURIComponent(parts[parts.length - 1] || 'evidence-file');
            return {
                complaintId: new Types.ObjectId(complaintId),
                responseId: responseId ? new Types.ObjectId(responseId) : null,
                uploadedBy: new Types.ObjectId(uploadedBy),
                fileName: fallbackName,
                fileUrl,
                mimeType: this.guessMimeTypeByName(fallbackName),
                fileSize: 0,
            };
        });

        await this.complaintAttachmentModel.insertMany(rows);
    }

    private async createHistoryRecord(payload: {
        complaintId: string;
        action: ComplaintHistoryAction;
        actorId?: string;
        actorRole: ComplaintActorRole;
        fromStatus?: ComplaintStatus;
        toStatus?: ComplaintStatus;
        note?: string;
        meta?: Record<string, unknown>;
    }): Promise<void> {
        await this.complaintHistoryModel.create({
            complaintId: new Types.ObjectId(payload.complaintId),
            action: payload.action,
            actorId: payload.actorId ? new Types.ObjectId(payload.actorId) : null,
            actorRole: payload.actorRole,
            fromStatus: payload.fromStatus || null,
            toStatus: payload.toStatus || null,
            note: payload.note || null,
            meta: payload.meta || null,
        });
    }

    private guessMimeTypeByName(fileName: string): string {
        const lowered = fileName.toLowerCase();
        if (lowered.endsWith('.png')) return 'image/png';
        if (lowered.endsWith('.jpg') || lowered.endsWith('.jpeg')) return 'image/jpeg';
        if (lowered.endsWith('.pdf')) return 'application/pdf';
        return 'application/octet-stream';
    }

    private async notifyAdminsOnCreated(complaint: ComplaintDocument, targetEntityName: string): Promise<void> {
        const admins = await this.userModel
            .find({ role: UserRole.ADMIN })
            .select('_id')
            .lean<Array<{ _id: Types.ObjectId }>>();

        const organizerId = await this.getComplaintOrganizerId(complaint);
        const complaintId = complaint._id.toString();
        const linkUrl = organizerId
            ? `/admin/complaints?id=${complaintId}&organizerId=${organizerId}`
            : `/admin/complaints?id=${complaintId}`;

        const adminIds = admins.map((item) => String(item._id));
        if (!adminIds.length) {
            return;
        }

        await this.notificationService.createBulkNotifications(adminIds, {
            senderName: 'Hệ thống',
            senderType: 'complaint-system',
            title: 'Có khiếu nại mới',
            message: `Khiếu nại mới cho ${targetEntityName}`,
            type: NotificationType.ALERT,
            linkUrl,
            groupKey: `complaint:${complaintId}`,
            meta: {
                complaintId,
                organizerId,
                targetEntityId: complaint.targetEntityId.toString(),
            },
        });
    }

    private async notifyComplainantOnReviewed(complaint: ComplaintDocument): Promise<void> {
        await this.notificationService.create({
            userId: complaint.complainantId.toString(),
            senderName: 'Quản trị viên',
            senderType: 'complaint-review',
            title: 'Khiếu nại đã được xử lý',
            message: `Khiếu nại "${complaint.title}" đã được cập nhật sang trạng thái ${complaint.status}.`,
            type: NotificationType.SYSTEM,
            linkUrl: `/complaints?id=${complaint._id.toString()}`,
            groupKey: `complaint:${complaint._id.toString()}:review`,
            meta: {
                complaintId: complaint._id.toString(),
                status: complaint.status,
                resolution: complaint.resolution || null,
            },
        });
    }
}
