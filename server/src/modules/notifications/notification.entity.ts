import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { NotificationType, NotificationPriority } from "src/global/globalEnum";

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    senderName: string;

    @Prop()
    senderType: string; // 'system', 'office', 'class', etc.

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ 
        required: true,
        enum: Object.values(NotificationType),
        default: NotificationType.SYSTEM,
    })
    type: NotificationType;

    @Prop({ 
        enum: Object.values(NotificationPriority),
        default: NotificationPriority.NORMAL,
    })
    priority: NotificationPriority;

    @Prop({ default: false, index: true })
    isRead: boolean;

    @Prop({ type: Date })
    readAt: Date;

    @Prop()
    linkUrl: string; // Deep link khi click vào notification

    @Prop()
    groupKey: string; // Để gom nhóm các notification liên quan

    @Prop({ type: Object })
    meta: Record<string, any>; // Metadata mở rộng (activityId, classId, etc.)
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Tạo compound index cho query hiệu quả
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
