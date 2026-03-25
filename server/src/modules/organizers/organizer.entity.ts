import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { OrganizerApprovalStatus } from "src/global/globalEnum";

export type OrganizerDocument = Organizer & Document;

@Schema({ timestamps: true })
export class Organizer {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    description: string;

    @Prop()
    image?: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    })
    reviewedBy?: Types.ObjectId | null;

    @Prop({
        type: Date,
        required: false,
        default: null,
    })
    reviewedAt?: Date | null;

    @Prop({
        type: String,
        required: false,
        default: null,
    })
    reviewNote?: string | null;

    @Prop({ required: true, default: false })
    isPriority: boolean;

    @Prop({
        required: true,
        default: OrganizerApprovalStatus.PENDING,
        enum: Object.values(OrganizerApprovalStatus),
    })
    approvalStatus: OrganizerApprovalStatus;

    @Prop({ required: true, default: 1 })
    status: number;

    createdAt?: Date;
    updatedAt?: Date;
}

export const OrganizerSchema = SchemaFactory.createForClass(Organizer);
