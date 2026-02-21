import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CheckinStatus } from 'src/global/globalEnum';

export type CheckinDocument = Checkin & Document;

@Schema({ timestamps: true })
export class Checkin {
    @Prop({ required: true, type: Types.ObjectId, ref: 'CheckinSession' })
    checkinSessionId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true })
    latitude: number;

    @Prop({ required: true })
    longitude: number;

    @Prop({ required: true })
    distance: number;

    @Prop({ required: true, enum: Object.values(CheckinStatus) })
    status: CheckinStatus;

    @Prop({ required: false, default: null })
    failReason?: string;

    @Prop({ required: true })
    deviceId: string;

    @Prop()
    createdAt?: Date;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);
