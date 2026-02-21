import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true, type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    userIds: Types.ObjectId[];

    @Prop({ required: true })
    firstSeen: Date;

    @Prop({ required: true })
    lastSeen: Date;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Tạo index để tìm kiếm nhanh
DeviceSchema.index({ id: 1 });
DeviceSchema.index({ userIds: 1 });
