import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ActivityParticipantDocument = ActivityParticipant & Document;

export enum ParticipantStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

@Schema({ timestamps: true })
export class ActivityParticipant {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Activity' })
    activityId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({
        required: false,
        default: ParticipantStatus.PENDING,
        enum: Object.values(ParticipantStatus)
    })
    status?: ParticipantStatus;

    @Prop({
        required: false,
        type: Types.ObjectId,
        ref: 'User',
        default: null
    })
    approvedBy?: Types.ObjectId;

    @Prop({
        required: false,
        default: null
    })
    approvedAt?: Date;

    @Prop({
        required: false,
        default: null
    })
    registeredAt: Date;
}

export const ActivityParticipantSchema = SchemaFactory.createForClass(ActivityParticipant);
