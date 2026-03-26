import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ActivityParticipantDocument = ActivityParticipant & Document;

export enum ParticipantStatus {
    REGISTERED = 'REGISTERED',
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
        enum: Object.values(ParticipantStatus),
        default: ParticipantStatus.REGISTERED,
    })
    status?: ParticipantStatus;

    @Prop({
        required: false,
        type: Date,
        default: null
    })
    registeredAt?: Date | null;
}

export const ActivityParticipantSchema = SchemaFactory.createForClass(ActivityParticipant);
