import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true, unique: true, index: true })
    activityId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop()
    lastMessageContent: string;

    @Prop()
    lastMessageAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    lastMessageUserId: Types.ObjectId;

    @Prop()
    lastMessageUserName: string;

    @Prop({ default: 0 })
    totalMessages: number;

    @Prop({ default: 0 })
    participantsCount: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes for performance
ConversationSchema.index({ activityId: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ isActive: 1 });
