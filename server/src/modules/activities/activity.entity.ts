import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ActivityStatus } from '../../global/globalEnum';

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
    location: string;

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
        ref: 'Category',
        required: true,
    })
    categoryId: Types.ObjectId;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
