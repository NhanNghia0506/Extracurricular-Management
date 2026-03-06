import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConversationRole } from '../../global/globalEnum';

export type ConversationMemberDocument = ConversationMember & Document;

@Schema({ timestamps: true })
export class ConversationMember {
    @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
    conversationId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop()
    lastReadAt: Date;

    @Prop({ default: Date.now })
    joinedAt: Date;

    @Prop({
        enum: Object.values(ConversationRole),
        default: ConversationRole.MEMBER
    })
    role: string;
}

export const ConversationMemberSchema = SchemaFactory.createForClass(ConversationMember);

// Compound index for unique constraint
ConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
ConversationMemberSchema.index({ userId: 1 });
