import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ActivityStatus } from '../../global/globalEnum';
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
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
