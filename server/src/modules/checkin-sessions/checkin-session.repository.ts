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
}
