import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheckinSession } from './checkin-session.entity';

@Injectable()
export class CheckinSessionRepository {
    constructor(
        @InjectModel(CheckinSession.name) private readonly checkinSessionModel: Model<CheckinSession>,
    ) { }

    create(checkinSession: Partial<CheckinSession>) {
        return this.checkinSessionModel.create(checkinSession);
    }

    findById(id: string): Promise<CheckinSession | null> {
        const newId = new Types.ObjectId(id);
        return this.checkinSessionModel.findById(newId);
    }

    findByActivityId(activityId: string): Promise<CheckinSession | null> {
        return this.checkinSessionModel
            .findOne({ activityId: new Types.ObjectId(activityId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    findAllByActivityId(activityId: string): Promise<CheckinSession[]> {
        return this.checkinSessionModel
            .find({ activityId: new Types.ObjectId(activityId) })
            .sort({ startTime: 1, createdAt: 1 })
            .exec();
    }

    async findIdsByActivityIds(activityIds: string[]): Promise<string[]> {
        const validIds = activityIds.filter((id) => Types.ObjectId.isValid(id));
        if (!validIds.length) {
            return [];
        }

        const rows = await this.checkinSessionModel
            .find({ activityId: { $in: validIds.map((id) => new Types.ObjectId(id)) } })
            .select('_id')
            .lean<{ _id: Types.ObjectId }[]>()
            .exec();

        return rows.map((row) => row._id.toString());
    }

    updateById(id: string, payload: Partial<CheckinSession>): Promise<CheckinSession | null> {
        return this.checkinSessionModel.findByIdAndUpdate(
            new Types.ObjectId(id),
            payload,
            { new: true },
        ).exec();
    }
}
