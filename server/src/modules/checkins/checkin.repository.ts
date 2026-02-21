import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Checkin } from './checkin.entity';
import { CheckinStatus } from 'src/global/globalEnum';

@Injectable()
export class CheckinRepository {
    constructor(
        @InjectModel(Checkin.name) private readonly checkinModel: Model<Checkin>,
    ) { }

    create(checkin: Partial<Checkin>) {
        return this.checkinModel.create(checkin);
    }

    /**
     * Kiểm tra xem thiết bị đã check-in thành công trong session này chưa
     */
    async findOneBySessionAndDevice(
        checkinSessionId: string,
        deviceId: string,
        status: CheckinStatus,
    ) {
        return this.checkinModel.findOne({
            checkinSessionId: new Types.ObjectId(checkinSessionId),
            deviceId,
            status,
        }).exec();
    }
}
