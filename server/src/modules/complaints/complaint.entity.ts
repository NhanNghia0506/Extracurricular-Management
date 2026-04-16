import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
    ComplaintResolution,
    ComplaintStatus,
} from 'src/global/globalEnum';

export type ComplaintDocument = Complaint & Document;

@Schema({ timestamps: true })
export class Complaint {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
    complainantId!: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, index: true })
    targetEntityId!: Types.ObjectId;

    @Prop({ required: true, maxlength: 120 })
    title!: string;

    @Prop({ required: true, maxlength: 2000 })
    description!: string;

    @Prop({ type: [String], default: [] })
    attachmentUrls!: string[];

    @Prop({ required: true, enum: Object.values(ComplaintStatus), default: ComplaintStatus.SUBMITTED, index: true })
    status!: ComplaintStatus;

    @Prop({ type: String, enum: Object.values(ComplaintResolution), default: null })
    resolution?: ComplaintResolution | null;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    reviewedBy?: Types.ObjectId | null;

    @Prop({ type: Date, default: null })
    reviewedAt?: Date | null;

    @Prop({ type: String, default: null, maxlength: 1000 })
    reviewNote?: string | null;

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt?: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt?: Date;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);

ComplaintSchema.index({ complainantId: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1, createdAt: -1 });
ComplaintSchema.index({ targetEntityId: 1, createdAt: -1 });
