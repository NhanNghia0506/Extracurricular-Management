import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type MessageDocument = Message & Document;

interface EditHistory {
    content: string;
    editedAt: Date;
}

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
    conversationId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    senderId: Types.ObjectId;

    @Prop({ required: true })
    senderName: string;

    @Prop()
    senderAvatar: string;

    @Prop({ required: true })
    content: string;

    @Prop({
        enum: ['sending', 'sent', 'delivered', 'read'],
        default: 'sending',
        index: true
    })
    status: string;

    @Prop({
        enum: ['text', 'image', 'file'],
        default: 'text'
    })
    messageType: string;

    @Prop({ type: [String], default: [] })
    reactions: string[];

    @Prop({
        type: [{
            content: String,
            editedAt: { type: Date, default: Date.now }
        }],
        default: []
    })
    editHistory: EditHistory[];

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ conversationId: 1, status: 1 });
