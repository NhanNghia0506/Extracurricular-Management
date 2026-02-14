import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CheckinSession } from './checkin-session.entity';

@Injectable()
export class CheckinSessionRepository {
    constructor(
        @InjectModel(CheckinSession.name) private readonly checkinSessionModel: Model<CheckinSession>,
    ) { }

    create(checkinSession: Partial<CheckinSession>) {
        return this.checkinSessionModel.create(checkinSession);
    }
}
