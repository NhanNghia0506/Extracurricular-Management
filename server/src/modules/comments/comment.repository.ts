import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './comment.entity';

interface CreateCommentPayload {
    activityId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    parentCommentId?: string;
}

@Injectable()
export class CommentRepository {
    constructor(
        @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    ) { }

    async create(payload: CreateCommentPayload): Promise<CommentDocument> {
        return this.commentModel.create({
            activityId: new Types.ObjectId(payload.activityId),
            authorId: new Types.ObjectId(payload.authorId),
            authorName: payload.authorName,
            authorAvatar: payload.authorAvatar,
            content: payload.content,
            parentCommentId: payload.parentCommentId
                ? new Types.ObjectId(payload.parentCommentId)
                : null,
        });
    }

    async findById(commentId: string): Promise<CommentDocument | null> {
        return this.commentModel.findById(commentId).exec();
    }

    async countRootByActivity(activityId: string): Promise<number> {
        return this.commentModel.countDocuments({
            activityId: new Types.ObjectId(activityId),
            parentCommentId: null,
        });
    }

    async findRootByActivity(
        activityId: string,
        limit: number,
        skip: number,
        sort: 'newest' | 'oldest',
    ): Promise<CommentDocument[]> {
        const sortDirection = sort === 'oldest' ? 1 : -1;

        return this.commentModel
            .find({
                activityId: new Types.ObjectId(activityId),
                parentCommentId: null,
            })
            .sort({ createdAt: sortDirection })
            .limit(limit)
            .skip(skip)
            .exec();
    }

    async findChildrenByParentIds(parentIds: string[]): Promise<CommentDocument[]> {
        if (parentIds.length === 0) {
            return [];
        }

        return this.commentModel
            .find({
                parentCommentId: {
                    $in: parentIds.map((id) => new Types.ObjectId(id)),
                },
            })
            .sort({ createdAt: 1 })
            .exec();
    }

    async updateContent(commentId: string, content: string): Promise<CommentDocument | null> {
        const comment = await this.findById(commentId);
        if (!comment) {
            return null;
        }

        if (comment.content !== content) {
            comment.editHistory.push({
                content: comment.content,
                editedAt: new Date(),
            });
            comment.content = content;
            comment.updatedAt = new Date();
        }

        return comment.save();
    }

    async deleteByIds(commentIds: string[]): Promise<number> {
        if (commentIds.length === 0) {
            return 0;
        }

        const result = await this.commentModel.deleteMany({
            _id: {
                $in: commentIds.map((id) => new Types.ObjectId(id)),
            },
        }).exec();

        return result.deletedCount ?? 0;
    }
}
