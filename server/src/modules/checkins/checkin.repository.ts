import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Checkin } from './checkin.entity';

@Injectable()
export class CheckinRepository {
    constructor(
        @InjectModel(Checkin.name) private readonly checkinModel: Model<Checkin>,
    ) { }

    create(checkin: Partial<Checkin>) {
        return this.checkinModel.create(checkin);
    }
}
