import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ComplaintAttachmentDocument = ComplaintAttachment & Document;

@Schema({ timestamps: true })
export class ComplaintAttachment {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Complaint', index: true })
    complaintId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'ComplaintResponse', default: null, index: true })
    responseId?: Types.ObjectId | null;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
    uploadedBy!: Types.ObjectId;

    @Prop({ required: true, maxlength: 255 })
    fileName!: string;

    @Prop({ required: true, maxlength: 1000 })
    fileUrl!: string;

    @Prop({ required: true, maxlength: 120, default: 'application/octet-stream' })
    mimeType!: string;

    @Prop({ required: true, default: 0 })
    fileSize!: number;

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt?: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt?: Date;
}

export const ComplaintAttachmentSchema = SchemaFactory.createForClass(ComplaintAttachment);

ComplaintAttachmentSchema.index({ complaintId: 1, createdAt: -1 });
ComplaintAttachmentSchema.index({ responseId: 1, createdAt: -1 });
