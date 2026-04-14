import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
    ComplaintActorRole,
    ComplaintHistoryAction,
    ComplaintStatus,
} from 'src/global/globalEnum';

export type ComplaintHistoryDocument = ComplaintHistory & Document;

@Schema({ timestamps: false })
export class ComplaintHistory {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Complaint', index: true })
    complaintId!: Types.ObjectId;

    @Prop({ required: true, enum: Object.values(ComplaintHistoryAction), index: true })
    action!: ComplaintHistoryAction;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
    actorId?: Types.ObjectId | null;

    @Prop({ required: true, enum: Object.values(ComplaintActorRole), index: true })
    actorRole!: ComplaintActorRole;

    @Prop({ type: String, enum: Object.values(ComplaintStatus), default: null })
    fromStatus?: ComplaintStatus | null;

    @Prop({ type: String, enum: Object.values(ComplaintStatus), default: null })
    toStatus?: ComplaintStatus | null;

    @Prop({ type: String, default: null, maxlength: 4000 })
    note?: string | null;

    @Prop({ type: Object, default: null })
    meta?: Record<string, unknown> | null;

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt?: Date;
}

export const ComplaintHistorySchema = SchemaFactory.createForClass(ComplaintHistory);

ComplaintHistorySchema.index({ complaintId: 1, createdAt: -1 });
ComplaintHistorySchema.index({ action: 1, createdAt: -1 });
