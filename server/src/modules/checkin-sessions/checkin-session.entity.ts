import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { LocationData } from 'src/global/globalInterface';

export type CheckinSessionDocument = CheckinSession & Document;

@Schema({ timestamps: true })
export class CheckinSession {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Activity' })
    activityId: Types.ObjectId;

    @Prop({
        required: true,
        type: {
            address: { type: String, required: true },
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
    })
    location: LocationData;

    @Prop({ required: true })
    startTime: Date;

    @Prop({ required: true })
    endTime: Date;

    @Prop({ required: true })
    radiusMetters: number;
}

export const CheckinSessionSchema = SchemaFactory.createForClass(CheckinSession);
