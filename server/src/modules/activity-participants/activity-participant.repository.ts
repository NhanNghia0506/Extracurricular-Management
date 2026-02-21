import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ActivityParticipant } from "./activity-participant.entity";
import { Model, Types } from "mongoose";

@Injectable()
export class ActivityParticipantRepository {
    constructor(
        @InjectModel(ActivityParticipant.name) private readonly activityParticipantModel: Model<ActivityParticipant>,
    ) { }

    create(activityParticipant: Partial<ActivityParticipant>) {
        return this.activityParticipantModel.create(activityParticipant);
    }

    countByActivityId(activityId: string): Promise<number> {
        const objectId = new Types.ObjectId(activityId);
        return this.activityParticipantModel.countDocuments({ activityId: objectId });
    }


    findByActivityIdWithClassFacultyNames(activityId: string) {
        const objectId = new Types.ObjectId(activityId);
        return this.activityParticipantModel.aggregate([
            { $match: { activityId: objectId } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'students',
                    localField: 'userId',
                    foreignField: 'userId',
                    as: 'student',
                },
            },
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'student.classId',
                    foreignField: '_id',
                    as: 'class',
                },
            },
            { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'faculties',
                    localField: 'student.facultyId',
                    foreignField: '_id',
                    as: 'faculty',
                },
            },
            { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    studentCode: '$student.studentCode',
                    studentName: '$user.name',
                    status: 1,
                    className: '$class.name',
                    facultyName: '$faculty.name',
                    registeredAt: 1,
                },
            },
        ]).exec();
    }

    findByActivityId(activityId: string) {
        const objectId = new Types.ObjectId(activityId);
        return this.activityParticipantModel.find({ activityId: objectId }).exec();
    }

    findByActivityAndUserId(activityId: string, userId: string) {
        return this.activityParticipantModel.findOne({
            activityId: new Types.ObjectId(activityId),
            userId: new Types.ObjectId(userId)
        }).exec();
    }
}
