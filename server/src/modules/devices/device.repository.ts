import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device } from './device.entity';

@Injectable()
export class DeviceRepository {
    constructor(
        @InjectModel(Device.name) private readonly deviceModel: Model<Device>,
    ) { }

    async create(device: Partial<Device>) {
        return this.deviceModel.create(device);
    }

    async findById(id: string) {
        return this.deviceModel.findOne({ id }).exec();
    }

    async findByUserId(userId: string) {
        return this.deviceModel.find({ userIds: new Types.ObjectId(userId) }).exec();
    }

    async updateLastSeen(id: string, lastSeen: Date) {
        return this.deviceModel.findOneAndUpdate(
            { id },
            { lastSeen },
            { new: true }
        ).exec();
    }

    async addUserToDevice(id: string, userId: Types.ObjectId) {
        return this.deviceModel.findOneAndUpdate(
            { id },
            { $addToSet: { userIds: userId } },
            { new: true }
        ).exec();
    }

    async findAll() {
        return this.deviceModel.find().exec();
    }
}
