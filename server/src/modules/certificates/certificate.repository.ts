import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Certificate } from './certificate.entity';

@Injectable()
export class CertificateRepository {
    constructor(
        @InjectModel(Certificate.name) private readonly certificateModel: Model<Certificate>,
    ) { }

    create(payload: Partial<Certificate>) {
        return this.certificateModel.create(payload);
    }

    findByUserAndActivity(userId: string, activityId: string) {
        return this.certificateModel
            .findOne({
                userId: new Types.ObjectId(userId),
                activityId: new Types.ObjectId(activityId),
            })
            .exec();
    }

    findByIdForUser(certificateId: string, userId: string) {
        return this.certificateModel
            .findOne({
                _id: new Types.ObjectId(certificateId),
                userId: new Types.ObjectId(userId),
            })
            .exec();
    }

    findByCode(certificateCode: string) {
        return this.certificateModel.findOne({ certificateCode }).exec();
    }

    findById(certificateId: string) {
        return this.certificateModel.findById(new Types.ObjectId(certificateId)).exec();
    }

    findByUser(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.certificateModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ issuedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }

    countByUser(userId: string) {
        return this.certificateModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec();
    }
}