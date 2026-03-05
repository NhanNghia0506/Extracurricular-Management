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

    /**
     * Lấy danh sách tất cả checkin theo sessionId
     * @param checkinSessionId - ID của session
     * @param status - (Optional) Lọc theo trạng thái checkin
     */
    async findBySessionId(
        checkinSessionId: string,
        status?: CheckinStatus,
    ) {
        const filter: any = {
            checkinSessionId: new Types.ObjectId(checkinSessionId),
        };

        if (status) {
            filter.status = status;
        }

        return this.checkinModel
            .find(filter)
            .sort({ createdAt: -1 })
            .exec();
    }
}
