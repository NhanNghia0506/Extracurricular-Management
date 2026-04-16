import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ComplaintActorRole } from 'src/global/globalEnum';

export type ComplaintResponseDocument = ComplaintResponse & Document;

@Schema({ timestamps: true })
export class ComplaintResponse {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Complaint', index: true })
    complaintId!: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
    senderId!: Types.ObjectId;

    @Prop({ required: true, enum: Object.values(ComplaintActorRole), index: true })
    senderRole!: ComplaintActorRole;

    @Prop({ required: true, maxlength: 4000 })
    message!: string;

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt?: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt?: Date;
}

export const ComplaintResponseSchema = SchemaFactory.createForClass(ComplaintResponse);

ComplaintResponseSchema.index({ complaintId: 1, createdAt: 1 });
