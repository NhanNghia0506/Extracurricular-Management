import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ActivityApprovalStatus, ActivityStatus } from '../../global/globalEnum';
import type { LocationData } from 'src/global/globalInterface';

export type ActivityDocument = Activity & Document;


@Schema({ timestamps: true })
export class Activity {
    @Prop({
        required: true,
    })
    title: string;

    @Prop({
        required: true,
    })
    description: string;

    @Prop({
        required: true,
    })
    startAt: Date;

    @Prop({
        type: Date,
        default: null,
    })
    endAt: Date;

    @Prop({
        required: true,
        type: {
            address: { type: String, required: true },
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        }
    })
    location: LocationData;

    @Prop({
        required: true,
        default: ActivityStatus.OPEN,
        enum: Object.values(ActivityStatus),
    })
    status: ActivityStatus;

    @Prop({
        required: false,
    })
    image: string;

    @Prop({
        type: Types.ObjectId,
        ref: 'Organizer',
        required: true,
    })
    organizerId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'ActivityCategory',
        required: true,
    })
    categoryId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    createdBy: Types.ObjectId;

    @Prop({
        required: false,
        default: 0,
    })
    trainingScore: number;

    @Prop({
        required: false,
        default: 0,
    })
    participantCount: number;

    @Prop({
        required: true,
        default: ActivityApprovalStatus.PENDING,
        enum: Object.values(ActivityApprovalStatus),
    })
    approvalStatus: ActivityApprovalStatus;

    @Prop({
        type: String,
        required: false,
        default: null,
    })
    reviewNote?: string | null;

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
        required: true,
        default: false,
    })
    isPriority: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
