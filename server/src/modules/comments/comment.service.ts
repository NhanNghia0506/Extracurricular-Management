import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRole } from 'src/global/globalEnum';
import { ActivityService } from '../activities/activity.service';
import UserService from '../users/user.service';
import { CommentRepository } from './comment.repository';
import { CommentDocument } from './comment.entity';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { ListCommentsDto } from './dtos/list-comments.dto';
import { CommentGateway } from '../../events/comment.gateway';

export interface CommentResponse {
    id: string;
    activityId: string;
    parentCommentId: string | null;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    edited: boolean;
    canEdit: boolean;
    canDelete: boolean;
    replies: CommentResponse[];
}

export interface ListCommentResponse {
    items: CommentResponse[];
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

@Injectable()
export class CommentService {
    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly activityService: ActivityService,
        private readonly userService: UserService,
        private readonly commentGateway: CommentGateway,
    ) { }

    private async ensureValidActivity(activityId: string) {
        if (!Types.ObjectId.isValid(activityId)) {
            throw new BadRequestException('activityId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.activityService.findById(activityId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động với ID đã cho');
        }

        return activity;
    }

    private toCommentResponse(
        comment: CommentDocument,
        currentUserId?: string,
        currentUserRole?: string,
        activityOwnerId?: string,
    ): CommentResponse {
        const authorId = comment.authorId.toString();
        const isAuthor = Boolean(currentUserId && authorId === currentUserId);
        const isAdmin = currentUserRole === UserRole.ADMIN;
        const isActivityOwner = Boolean(activityOwnerId && currentUserId && activityOwnerId === currentUserId);

        return {
            id: comment._id.toString(),
            activityId: comment.activityId.toString(),
            parentCommentId: comment.parentCommentId ? comment.parentCommentId.toString() : null,
            authorId,
            authorName: comment.authorName,
            authorAvatar: comment.authorAvatar,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            edited: Array.isArray(comment.editHistory) && comment.editHistory.length > 0,
            canEdit: isAuthor,
            canDelete: isAuthor || isAdmin || isActivityOwner,
            replies: [],
        };
    }

    private async collectDescendantsByRootIds(rootIds: string[]): Promise<CommentDocument[]> {
        const descendants: CommentDocument[] = [];
        let frontier = [...rootIds];

        while (frontier.length > 0) {
            const nextLevel = await this.commentRepository.findChildrenByParentIds(frontier);
            if (nextLevel.length === 0) {
                break;
            }

            descendants.push(...nextLevel);
            frontier = nextLevel.map((comment) => comment._id.toString());
        }

        return descendants;
    }

    private buildCommentTree(
        roots: CommentDocument[],
        descendants: CommentDocument[],
        currentUserId?: string,
        currentUserRole?: string,
        activityOwnerId?: string,
    ): CommentResponse[] {
        const rootResponses = roots.map((root) => this.toCommentResponse(root, currentUserId, currentUserRole, activityOwnerId));
        const byId = new Map<string, CommentResponse>();

        rootResponses.forEach((root) => {
            byId.set(root.id, root);
        });

        descendants.forEach((comment) => {
            const response = this.toCommentResponse(comment, currentUserId, currentUserRole, activityOwnerId);
            byId.set(response.id, response);
        });

        descendants.forEach((comment) => {
            const current = byId.get(comment._id.toString());
            const parentId = comment.parentCommentId?.toString();

            if (!current || !parentId) {
                return;
            }

            const parent = byId.get(parentId);
            if (!parent) {
                return;
            }

            parent.replies.push(current);
        });

        return rootResponses;
    }

    private async getCommentWithPermissionContext(
        commentId: string,
    ): Promise<{ comment: CommentDocument; activityOwnerId: string }> {
        if (!Types.ObjectId.isValid(commentId)) {
            throw new BadRequestException('commentId phải là MongoDB ObjectId hợp lệ');
        }

        const comment = await this.commentRepository.findById(commentId);
        if (!comment) {
            throw new NotFoundException('Không tìm thấy bình luận với ID đã cho');
        }

        const activity = await this.ensureValidActivity(comment.activityId.toString());
        return {
            comment,
            activityOwnerId: activity.createdBy.toString(),
        };
    }

    async listByActivity(
        activityId: string,
        query: ListCommentsDto,
        currentUserId?: string,
        currentUserRole?: string,
    ): Promise<ListCommentResponse> {
        const activity = await this.ensureValidActivity(activityId);

        const limit = query.limit ?? 20;
        const skip = query.skip ?? 0;
        const sort = query.sort ?? 'newest';

        const [total, roots] = await Promise.all([
            this.commentRepository.countRootByActivity(activityId),
            this.commentRepository.findRootByActivity(activityId, limit, skip, sort),
        ]);

        const descendants = await this.collectDescendantsByRootIds(
            roots.map((root) => root._id.toString()),
        );

        return {
            items: this.buildCommentTree(
                roots,
                descendants,
                currentUserId,
                currentUserRole,
                activity.createdBy.toString(),
            ),
            total,
            limit,
            skip,
            hasMore: skip + roots.length < total,
        };
    }

    async create(
        activityId: string,
        createCommentDto: CreateCommentDto,
        currentUserId: string,
        currentUserName: string,
        currentUserRole?: string,
    ): Promise<CommentResponse> {
        if (!Types.ObjectId.isValid(currentUserId)) {
            throw new BadRequestException('currentUserId phải là MongoDB ObjectId hợp lệ');
        }

        const content = createCommentDto.content?.trim();
        if (!content) {
            throw new BadRequestException('Nội dung bình luận không được để trống');
        }

        const parentCommentId = createCommentDto.parentCommentId?.trim();
        if (parentCommentId && !Types.ObjectId.isValid(parentCommentId)) {
            throw new BadRequestException('parentCommentId phải là MongoDB ObjectId hợp lệ');
        }

        const activity = await this.ensureValidActivity(activityId);
        let authorAvatar: string | undefined;

        try {
            const profile = await this.userService.getProfile(currentUserId);
            authorAvatar = profile.avatar || undefined;
        } catch (_error) {
            authorAvatar = undefined;
        }

        if (parentCommentId) {
            const parentComment = await this.commentRepository.findById(parentCommentId);
            if (!parentComment) {
                throw new NotFoundException('Không tìm thấy bình luận cha');
            }

            if (parentComment.activityId.toString() !== activityId) {
                throw new BadRequestException('Bình luận trả lời phải thuộc cùng activity');
            }
        }

        const created = await this.commentRepository.create({
            activityId,
            authorId: currentUserId,
            authorName: currentUserName,
            authorAvatar,
            content,
            parentCommentId,
        });

        const response = this.toCommentResponse(
            created,
            currentUserId,
            currentUserRole,
            activity.createdBy.toString(),
        );

        this.commentGateway.emitCommentCreated(response);
        return response;
    }

    async update(
        commentId: string,
        updateCommentDto: UpdateCommentDto,
        currentUserId: string,
        currentUserRole?: string,
    ): Promise<CommentResponse> {
        const { comment, activityOwnerId } = await this.getCommentWithPermissionContext(commentId);

        if (comment.authorId.toString() !== currentUserId) {
            throw new ForbiddenException('Bạn chỉ có thể chỉnh sửa bình luận của chính mình');
        }

        const updated = await this.commentRepository.updateContent(commentId, updateCommentDto.content.trim());
        if (!updated) {
            throw new NotFoundException('Không tìm thấy bình luận với ID đã cho');
        }

        const response = this.toCommentResponse(updated, currentUserId, currentUserRole, activityOwnerId);
        this.commentGateway.emitCommentUpdated(response);

        return response;
    }

    async delete(
        commentId: string,
        currentUserId: string,
        currentUserRole?: string,
    ): Promise<{ deletedCommentIds: string[]; deletedCount: number }> {
        const { comment, activityOwnerId } = await this.getCommentWithPermissionContext(commentId);

        const isAuthor = comment.authorId.toString() === currentUserId;
        const isAdmin = currentUserRole === UserRole.ADMIN;
        const isActivityOwner = activityOwnerId === currentUserId;

        if (!isAuthor && !isAdmin && !isActivityOwner) {
            throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
        }

        const deletedCommentIds = [commentId];
        let frontier = [commentId];

        while (frontier.length > 0) {
            const children = await this.commentRepository.findChildrenByParentIds(frontier);
            if (children.length === 0) {
                break;
            }

            const childIds = children.map((child) => child._id.toString());
            deletedCommentIds.push(...childIds);
            frontier = childIds;
        }

        const deletedCount = await this.commentRepository.deleteByIds(deletedCommentIds);

        this.commentGateway.emitCommentDeleted(comment.activityId.toString(), {
            deletedCommentIds,
            deletedCount,
        });

        return {
            deletedCommentIds,
            deletedCount,
        };
    }
}
