import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ActivityParticipant, ActivityParticipantDocument, ParticipantStatus } from "./activity-participant.entity";
import { Model, Types } from "mongoose";
import { CheckinSession } from "../checkin-sessions/checkin-session.entity";
import { Checkin } from "../checkins/checkin.entity";
import { CheckinStatus } from "src/global/globalEnum";

interface RegisteredActivityScheduleRow {
    activityId: Types.ObjectId;
    title: string;
    startAt: Date;
    endAt?: Date;
}

interface PendingParticipantRow {
    _id: Types.ObjectId;
    activityId: Types.ObjectId;
    userId: Types.ObjectId;
    registeredAt?: Date;
}

interface PerfectAttendanceRow {
    _id: Types.ObjectId;
    attendedSessionCount: number;
}

@Injectable()
export class ActivityParticipantRepository {
    constructor(
        @InjectModel(ActivityParticipant.name) private readonly activityParticipantModel: Model<ActivityParticipant>,
        @InjectModel(CheckinSession.name) private readonly checkinSessionModel: Model<CheckinSession>,
        @InjectModel(Checkin.name) private readonly checkinModel: Model<Checkin>,
    ) { }

    create(activityParticipant: Partial<ActivityParticipant>) {
        return this.activityParticipantModel.create(activityParticipant);
    }

    countByActivityId(activityId: string): Promise<number> {
        const objectId = new Types.ObjectId(activityId);
        return this.activityParticipantModel.countDocuments({ activityId: objectId });
    }

    // Count only REGISTERED participants (for capacity checking)
    countRegisteredByActivityId(activityId: string): Promise<number> {
        const objectId = new Types.ObjectId(activityId);
        return this.activityParticipantModel.countDocuments({
            activityId: objectId,
            status: ParticipantStatus.REGISTERED,
        });
    }

    // Find first PENDING participant in queue for auto-promotion
    findFirstPendingByActivityId(activityId: string): Promise<PendingParticipantRow | null> {
        const objectId = new Types.ObjectId(activityId);
        return this.activityParticipantModel.findOne({
            activityId: objectId,
            status: ParticipantStatus.PENDING,
        }).sort({ registeredAt: 1 }).select('_id activityId userId registeredAt').lean<PendingParticipantRow>().exec();
    }

    // Find participant by ID (for fetching single record)
    findById(id: string): Promise<ActivityParticipantDocument | null> {
        return this.activityParticipantModel.findById(new Types.ObjectId(id)).exec();
    }

    // Update participant status
    updateStatus(id: string, status: ParticipantStatus): Promise<ActivityParticipantDocument | null> {
        return this.activityParticipantModel.findByIdAndUpdate(
            new Types.ObjectId(id),
            { status },
            { new: true },
        ).exec();
    }

    async findUserIdsWithPerfectAttendance(activityId: string): Promise<string[]> {
        const sessions: Array<{ _id: Types.ObjectId }> = await this.checkinSessionModel
            .find({ activityId: new Types.ObjectId(activityId) })
            .select('_id')
            .lean<Array<{ _id: Types.ObjectId }>>()
            .exec();

        if (sessions.length === 0) {
            return [];
        }

        const sessionIds: Types.ObjectId[] = sessions.map((session) => session._id);
        const eligible: PerfectAttendanceRow[] = await this.checkinModel.aggregate<PerfectAttendanceRow>([
            {
                $match: {
                    checkinSessionId: { $in: sessionIds },
                    status: { $in: [CheckinStatus.SUCCESS, CheckinStatus.LATE] },
                },
            },
            {
                $group: {
                    _id: '$userId',
                    sessionIds: { $addToSet: '$checkinSessionId' },
                },
            },
            {
                $project: {
                    attendedSessionCount: { $size: '$sessionIds' },
                },
            },
            {
                $match: {
                    attendedSessionCount: sessionIds.length,
                },
            },
        ]).exec();

        return eligible.map((row) => row._id.toString());
    }

    async updateStatusesByActivityAndUserIds(
        activityId: string,
        userIds: string[],
        status: ParticipantStatus,
    ): Promise<number> {
        if (userIds.length === 0) {
            return 0;
        }

        const result = await this.activityParticipantModel.updateMany(
            {
                activityId: new Types.ObjectId(activityId),
                userId: { $in: userIds.map((userId) => new Types.ObjectId(userId)) },
                status: { $nin: [ParticipantStatus.CANCELLED, ParticipantStatus.REJECTED, ParticipantStatus.PARTICIPATED] },
            },
            {
                $set: { status },
            },
        ).exec();

        return result.modifiedCount || 0;
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
                    localField: 'class.facultyId',
                    foreignField: '_id',
                    as: 'faculty',
                },
            },
            { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    userId: '$user._id',
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

    findApprovedByActivityId(activityId: string) {
        const objectId = new Types.ObjectId(activityId);
        return this.activityParticipantModel.find({
            activityId: objectId,
            status: { $ne: ParticipantStatus.CANCELLED },
        }).exec();
    }

    findByActivityAndUserId(activityId: string, userId: string) {
        return this.activityParticipantModel.findOne({
            activityId: new Types.ObjectId(activityId),
            userId: new Types.ObjectId(userId)
        }).exec();
    }

    findActiveByActivityAndUserId(activityId: string, userId: string) {
        return this.activityParticipantModel.findOne({
            activityId: new Types.ObjectId(activityId),
            userId: new Types.ObjectId(userId),
            status: { $ne: ParticipantStatus.CANCELLED },
        }).exec();
    }

    findLatestByActivityAndUserId(activityId: string, userId: string) {
        return this.activityParticipantModel.findOne({
            activityId: new Types.ObjectId(activityId),
            userId: new Types.ObjectId(userId),
        }).sort({ updatedAt: -1, createdAt: -1 }).exec();
    }

    reactivateRegistration(id: string, status: ParticipantStatus, registeredAt: Date) {
        return this.activityParticipantModel.findByIdAndUpdate(
            new Types.ObjectId(id),
            {
                $set: {
                    status,
                    registeredAt,
                },
            },
            { new: true },
        ).exec();
    }

    deleteByActivityId(activityId: string) {
        return this.activityParticipantModel.deleteMany({
            activityId: new Types.ObjectId(activityId),
        }).exec();
    }

    findActivitiesByUserId(userId: string) {
        const objectId = new Types.ObjectId(userId);
        return this.activityParticipantModel.aggregate([
            { $match: { userId: objectId } },
            {
                $lookup: {
                    from: 'activities',
                    localField: 'activityId',
                    foreignField: '_id',
                    as: 'activity',
                },
            },
            { $unwind: { path: '$activity', preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: 'organizers',
                    localField: 'activity.organizerId',
                    foreignField: '_id',
                    as: 'organizer',
                },
            },
            { $unwind: { path: '$organizer', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'activitycategories',
                    localField: 'activity.categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    participantId: '$_id',
                    activityId: '$activity._id',
                    title: '$activity.title',
                    description: '$activity.description',
                    image: '$activity.image',
                    location: '$activity.location',
                    startAt: '$activity.startAt',
                    endAt: '$activity.endAt',
                    status: '$activity.status',
                    trainingScore: '$activity.trainingScore',
                    organizerId: { _id: '$organizer._id', name: '$organizer.name' },
                    categoryId: { _id: '$category._id', name: '$category.name' },
                    registeredAt: '$registeredAt',
                    participantStatus: '$status'
                },
            },
        ]).exec();
    }

    findUserRegisteredActivitySchedules(userId: string, excludeActivityId?: string): Promise<RegisteredActivityScheduleRow[]> {
        const objectId = new Types.ObjectId(userId);
        const excludedObjectId = excludeActivityId ? new Types.ObjectId(excludeActivityId) : null;

        return this.activityParticipantModel.aggregate<RegisteredActivityScheduleRow>([
            {
                $match: {
                    userId: objectId,
                    status: { $nin: [ParticipantStatus.CANCELLED, ParticipantStatus.REJECTED] },
                },
            },
            {
                $lookup: {
                    from: 'activities',
                    localField: 'activityId',
                    foreignField: '_id',
                    as: 'activity',
                },
            },
            { $unwind: { path: '$activity', preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    ...(excludedObjectId ? { 'activity._id': { $ne: excludedObjectId } } : {}),
                    'activity.status': { $ne: 'CANCELLED' },
                },
            },
            {
                $project: {
                    _id: 0,
                    activityId: '$activity._id',
                    title: '$activity.title',
                    startAt: '$activity.startAt',
                    endAt: '$activity.endAt',
                },
            },
        ]).exec();
    }
}
