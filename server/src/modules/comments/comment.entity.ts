import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

interface CommentEditHistory {
    content: string;
    editedAt: Date;
}

@Schema({ timestamps: true })
export class Comment {
    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true, index: true })
    activityId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    authorId: Types.ObjectId;

    @Prop({ required: true })
    authorName: string;

    @Prop()
    authorAvatar?: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
    parentCommentId?: Types.ObjectId | null;

    @Prop({
        type: [{
            content: String,
            editedAt: { type: Date, default: Date.now },
        }],
        default: [],
    })
    editHistory: CommentEditHistory[];

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ activityId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1 });
