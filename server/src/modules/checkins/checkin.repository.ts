import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Checkin, CheckinDocument } from './checkin.entity';
import { ActivityStatus, CheckinStatus } from 'src/global/globalEnum';

interface AttendanceHistoryFilter {
    userId: string;
    statuses?: CheckinStatus[];
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
}

interface AttendanceHistoryItemRaw {
    checkinId: Types.ObjectId;
    activityId: Types.ObjectId;
    activityTitle: string;
    organizerName?: string;
    activityStatus?: ActivityStatus;
    activityStartAt?: Date;
    activityEndAt?: Date;
    sessionId: Types.ObjectId;
    sessionTitle: string;
    checkinTime: Date;
    locationAddress: string;
    status: CheckinStatus;
    trainingScore: number;
}

interface AttendanceHistorySummaryRaw {
    totalSessions: number;
    successCount: number;
    lateCount: number;
    failedCount: number;
    cumulativeTrainingScore: number;
    participatedActivityIds: Types.ObjectId[];
}

export interface AttendanceHistoryItem {
    checkinId: string;
    activityId: string;
    activityTitle: string;
    organizerName?: string;
    activityStatus?: ActivityStatus;
    activityStartAt?: Date;
    activityEndAt?: Date;
    sessionId: string;
    sessionTitle: string;
    checkinTime: Date;
    locationAddress: string;
    status: CheckinStatus;
    trainingScore: number;
}

export interface AttendanceHistorySummary {
    totalSessions: number;
    successCount: number;
    lateCount: number;
    failedCount: number;
    cumulativeTrainingScore: number;
    totalParticipatedActivities: number;
}

export interface AttendanceHistoryQueryResult {
    items: AttendanceHistoryItem[];
    total: number;
    summary: AttendanceHistorySummary;
}

export type TrainingScoreReportView = 'student' | 'class' | 'faculty';

export interface TrainingScoreReportFilter {
    view: TrainingScoreReportView;
    fromDate?: Date;
    toDate?: Date;
    facultyId?: string;
    classId?: string;
    page: number;
    limit: number;
}

export interface TrainingScoreReportSummary {
    totalTrainingScore: number;
    totalCompletedActivities: number;
    totalStudents: number;
    averageTrainingScore: number;
}

export interface TrainingScoreStudentItem {
    studentId: string;
    studentName: string;
    studentCode: string;
    email: string;
    classId: string;
    className: string;
    facultyId: string;
    facultyName: string;
    completedActivities: number;
    totalTrainingScore: number;
}

export interface TrainingScoreClassItem {
    classId: string;
    className: string;
    facultyId: string;
    facultyName: string;
    studentCount: number;
    completedActivities: number;
    totalTrainingScore: number;
    averageTrainingScore: number;
}

export interface TrainingScoreFacultyItem {
    facultyId: string;
    facultyName: string;
    classCount: number;
    studentCount: number;
    completedActivities: number;
    totalTrainingScore: number;
    averageTrainingScore: number;
}

export interface TrainingScoreReportQueryResult {
    items: Array<TrainingScoreStudentItem | TrainingScoreClassItem | TrainingScoreFacultyItem>;
    total: number;
    summary: TrainingScoreReportSummary;
}

export interface StudentStatsFilter {
    startDate: Date;
    endDate: Date;
    facultyId?: string;
    classId?: string;
}

export interface StudentStatsRecord {
    studentId: string;
    name: string;
    studentCode: string;
    className: string;
    activityTitle: string;
    trainingScore: number;
    firstCheckinAt: Date;
}

@Injectable()
export class CheckinRepository {
    constructor(
        @InjectModel(Checkin.name) private readonly checkinModel: Model<CheckinDocument>,
    ) { }

    create(checkin: Partial<Checkin>): Promise<CheckinDocument> {
        return this.checkinModel.create(checkin);
    }

    /**
     * Kiểm tra xem thiết bị đã check-in thành công trong session này chưa
     */
    async findOneBySessionAndDevice(
        checkinSessionId: string,
        deviceId: string,
        status: CheckinStatus | CheckinStatus[],
    ): Promise<CheckinDocument | null> {
        return this.checkinModel.findOne({
            checkinSessionId: new Types.ObjectId(checkinSessionId),
            deviceId,
            status: Array.isArray(status) ? { $in: status } : status,
        }).exec();
    }

    async findOneBySessionAndUser(
        checkinSessionId: string,
        userId: string,
        status: CheckinStatus | CheckinStatus[],
    ): Promise<CheckinDocument | null> {
        return this.checkinModel.findOne({
            checkinSessionId: new Types.ObjectId(checkinSessionId),
            userId: new Types.ObjectId(userId),
            status: Array.isArray(status) ? { $in: status } : status,
        }).exec();
    }

    async findLatestBySessionAndUser(checkinSessionId: string, userId: string): Promise<CheckinDocument | null> {
        return this.checkinModel
            .findOne({
                checkinSessionId: new Types.ObjectId(checkinSessionId),
                userId: new Types.ObjectId(userId),
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findById(checkinId: string): Promise<CheckinDocument | null> {
        return this.checkinModel.findById(new Types.ObjectId(checkinId)).exec();
    }

    async updateStatus(
        checkinId: string,
        payload: {
            status: CheckinStatus;
            adjustedBy: string;
            adjustmentReason: string;
            failReason?: string | null;
        },
    ): Promise<CheckinDocument | null> {
        return this.checkinModel
            .findByIdAndUpdate(
                new Types.ObjectId(checkinId),
                {
                    status: payload.status,
                    failReason: payload.failReason ?? null,
                    adjustedBy: new Types.ObjectId(payload.adjustedBy),
                    adjustmentReason: payload.adjustmentReason,
                    adjustedAt: new Date(),
                },
                { new: true },
            )
            .exec();
    }

    async updateComplaintAdjustment(
        checkinId: string,
        payload: {
            status?: CheckinStatus;
            trainingScoreDelta?: number;
            adjustedBy: string;
            adjustmentReason: string;
        },
    ): Promise<CheckinDocument | null> {
        const updateData: Record<string, unknown> = {
            adjustedBy: new Types.ObjectId(payload.adjustedBy),
            adjustedAt: new Date(),
            adjustmentReason: payload.adjustmentReason,
        };

        if (payload.status !== undefined) {
            updateData.status = payload.status;
        }

        if (payload.trainingScoreDelta !== undefined) {
            updateData.trainingScoreDelta = payload.trainingScoreDelta;
        }

        return this.checkinModel
            .findByIdAndUpdate(new Types.ObjectId(checkinId), updateData, { new: true })
            .exec();
    }

    /**
     * Lấy danh sách tất cả checkin theo sessionId
     * @param checkinSessionId - ID của session
     * @param status - (Optional) Lọc theo trạng thái checkin
     */
    async findBySessionId(
        checkinSessionId: string,
        status?: CheckinStatus,
    ): Promise<CheckinDocument[]> {
        const filter: {
            checkinSessionId: Types.ObjectId;
            status?: CheckinStatus;
        } = {
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

    async findLatestByUserId(userId: string): Promise<CheckinDocument | null> {
        return this.checkinModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findMyAttendanceHistory(filter: AttendanceHistoryFilter): Promise<AttendanceHistoryQueryResult> {
        const skip = (filter.page - 1) * filter.limit;
        const matchFilter: {
            userId: Types.ObjectId;
            createdAt?: { $gte?: Date; $lte?: Date };
            status?: { $in: CheckinStatus[] };
        } = {
            userId: new Types.ObjectId(filter.userId),
        };

        if (filter.statuses && filter.statuses.length > 0) {
            matchFilter.status = { $in: filter.statuses };
        }

        if (filter.startDate || filter.endDate) {
            matchFilter.createdAt = {};
            if (filter.startDate) {
                matchFilter.createdAt.$gte = filter.startDate;
            }
            if (filter.endDate) {
                matchFilter.createdAt.$lte = filter.endDate;
            }
        }

        const pipeline: PipelineStage[] = [
            { $match: matchFilter },
            {
                $lookup: {
                    from: 'checkinsessions',
                    localField: 'checkinSessionId',
                    foreignField: '_id',
                    as: 'session',
                },
            },
            { $unwind: { path: '$session', preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: 'activities',
                    localField: 'session.activityId',
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
                $project: {
                    _id: 0,
                    checkinId: '$_id',
                    activityId: '$activity._id',
                    activityTitle: '$activity.title',
                    organizerName: '$organizer.name',
                    activityStatus: '$activity.status',
                    activityStartAt: '$activity.startAt',
                    activityEndAt: '$activity.endAt',
                    sessionId: '$session._id',
                    sessionTitle: '$session.title',
                    checkinTime: '$createdAt',
                    locationAddress: '$session.location.address',
                    status: '$status',
                    trainingScore: {
                        $add: [
                            { $ifNull: ['$activity.trainingScore', 0] },
                            { $ifNull: ['$trainingScoreDelta', 0] },
                        ],
                    },
                },
            },
            {
                $facet: {
                    items: [
                        { $sort: { checkinTime: -1 } },
                        { $skip: skip },
                        { $limit: filter.limit },
                    ],
                    totalCount: [
                        { $count: 'count' },
                    ],
                    summary: [
                        {
                            $group: {
                                _id: '$activityId',
                                activityTitle: { $first: '$activityTitle' },
                                activityTrainingScore: { $first: '$trainingScore' },
                                activityHasAwardedScore: {
                                    $max: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $in: ['$status', [CheckinStatus.SUCCESS, CheckinStatus.LATE]] },
                                                    { $eq: ['$activityStatus', ActivityStatus.COMPLETED] },
                                                ],
                                            },
                                            1,
                                            0,
                                        ],
                                    },
                                },
                                sessionCount: { $sum: 1 },
                                successCount: {
                                    $sum: {
                                        $cond: [{ $eq: ['$status', CheckinStatus.SUCCESS] }, 1, 0],
                                    },
                                },
                                lateCount: {
                                    $sum: {
                                        $cond: [{ $eq: ['$status', CheckinStatus.LATE] }, 1, 0],
                                    },
                                },
                                failedCount: {
                                    $sum: {
                                        $cond: [{ $eq: ['$status', CheckinStatus.FAILED] }, 1, 0],
                                    },
                                },
                                participatedActivityIds: { $addToSet: '$activityId' },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalSessions: { $sum: '$sessionCount' },
                                successCount: { $sum: '$successCount' },
                                lateCount: { $sum: '$lateCount' },
                                failedCount: { $sum: '$failedCount' },
                                cumulativeTrainingScore: {
                                    $sum: {
                                        $cond: [{ $eq: ['$activityHasAwardedScore', 1] }, '$activityTrainingScore', 0],
                                    },
                                },
                                participatedActivityIds: { $addToSet: '$_id' },
                            },
                        },
                    ],
                },
            },
        ];

        const [result] = await this.checkinModel.aggregate<{
            items: AttendanceHistoryItemRaw[];
            totalCount: Array<{ count: number }>;
            summary: AttendanceHistorySummaryRaw[];
        }>(pipeline).exec();

        const items: AttendanceHistoryItem[] = (result?.items || []).map((item) => ({
            ...item,
            checkinId: item.checkinId.toString(),
            activityId: item.activityId.toString(),
            sessionId: item.sessionId.toString(),
        }));

        const total = result?.totalCount?.[0]?.count || 0;
        const summaryRaw = result?.summary?.[0];

        const summary: AttendanceHistorySummary = {
            totalSessions: summaryRaw?.totalSessions || 0,
            successCount: summaryRaw?.successCount || 0,
            lateCount: summaryRaw?.lateCount || 0,
            failedCount: summaryRaw?.failedCount || 0,
            cumulativeTrainingScore: summaryRaw?.cumulativeTrainingScore || 0,
            totalParticipatedActivities: summaryRaw?.participatedActivityIds?.length || 0,
        };

        return {
            items,
            total,
            summary,
        };
    }

    async findTrainingScoreReport(filter: TrainingScoreReportFilter): Promise<TrainingScoreReportQueryResult> {
        const skip = (filter.page - 1) * filter.limit;
        const now = new Date();

        const matchFilter: {
            status: { $in: CheckinStatus[] };
            createdAt?: { $gte?: Date; $lte?: Date };
        } = {
            status: { $in: [CheckinStatus.SUCCESS, CheckinStatus.LATE] },
        };

        if (filter.fromDate || filter.toDate) {
            matchFilter.createdAt = {};
            if (filter.fromDate) {
                matchFilter.createdAt.$gte = filter.fromDate;
            }
            if (filter.toDate) {
                matchFilter.createdAt.$lte = filter.toDate;
            }
        }

        const basePipeline: PipelineStage[] = [
            { $match: matchFilter },
            {
                $lookup: {
                    from: 'checkinsessions',
                    localField: 'checkinSessionId',
                    foreignField: '_id',
                    as: 'session',
                },
            },
            { $unwind: { path: '$session', preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: 'activities',
                    localField: 'session.activityId',
                    foreignField: '_id',
                    as: 'activity',
                },
            },
            { $unwind: { path: '$activity', preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    $or: [
                        { 'activity.status': ActivityStatus.COMPLETED },
                        {
                            $and: [
                                { 'activity.endAt': { $ne: null } },
                                { 'activity.endAt': { $lte: now } },
                            ],
                        },
                        {
                            $and: [
                                { 'activity.endAt': null },
                                { 'activity.startAt': { $lte: now } },
                            ],
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'userId',
                    foreignField: 'userId',
                    as: 'student',
                },
            },
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: false } },
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
        ];

        if (filter.facultyId && Types.ObjectId.isValid(filter.facultyId)) {
            basePipeline.push({ $match: { 'faculty._id': new Types.ObjectId(filter.facultyId) } });
        }

        if (filter.classId && Types.ObjectId.isValid(filter.classId)) {
            basePipeline.push({ $match: { 'class._id': new Types.ObjectId(filter.classId) } });
        }

        basePipeline.push(
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        activityId: '$activity._id',
                    },
                    userId: { $first: '$userId' },
                    studentCode: { $first: '$student.studentCode' },
                    studentName: { $first: '$user.name' },
                    email: { $first: '$user.email' },
                    classId: { $first: '$class._id' },
                    className: { $first: '$class.name' },
                    facultyId: { $first: '$faculty._id' },
                    facultyName: { $first: '$faculty.name' },
                    trainingScore: {
                        $max: {
                            $add: [
                                { $ifNull: ['$activity.trainingScore', 0] },
                                { $ifNull: ['$trainingScoreDelta', 0] },
                            ],
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$userId',
                    studentId: { $first: '$userId' },
                    studentCode: { $first: '$studentCode' },
                    studentName: { $first: '$studentName' },
                    email: { $first: '$email' },
                    classId: { $first: '$classId' },
                    className: { $first: '$className' },
                    facultyId: { $first: '$facultyId' },
                    facultyName: { $first: '$facultyName' },
                    completedActivities: { $sum: 1 },
                    totalTrainingScore: { $sum: '$trainingScore' },
                },
            },
            {
                $project: {
                    _id: 0,
                    studentId: { $toString: '$studentId' },
                    studentCode: { $ifNull: ['$studentCode', 'N/A'] },
                    studentName: { $ifNull: ['$studentName', 'Unknown'] },
                    email: { $ifNull: ['$email', ''] },
                    classId: {
                        $cond: [
                            { $ifNull: ['$classId', false] },
                            { $toString: '$classId' },
                            '',
                        ],
                    },
                    className: { $ifNull: ['$className', 'N/A'] },
                    facultyId: {
                        $cond: [
                            { $ifNull: ['$facultyId', false] },
                            { $toString: '$facultyId' },
                            '',
                        ],
                    },
                    facultyName: { $ifNull: ['$facultyName', 'N/A'] },
                    completedActivities: 1,
                    totalTrainingScore: 1,
                },
            },
        );

        const viewPipelines: Record<TrainingScoreReportView, PipelineStage[]> = {
            student: [
                {
                    $sort: {
                        totalTrainingScore: -1,
                        completedActivities: -1,
                        studentName: 1,
                    },
                },
            ],
            class: [
                {
                    $group: {
                        _id: '$classId',
                        classId: { $first: '$classId' },
                        className: { $first: '$className' },
                        facultyId: { $first: '$facultyId' },
                        facultyName: { $first: '$facultyName' },
                        studentCount: { $sum: 1 },
                        completedActivities: { $sum: '$completedActivities' },
                        totalTrainingScore: { $sum: '$totalTrainingScore' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        classId: 1,
                        className: 1,
                        facultyId: 1,
                        facultyName: 1,
                        studentCount: 1,
                        completedActivities: 1,
                        totalTrainingScore: 1,
                        averageTrainingScore: {
                            $cond: [
                                { $gt: ['$studentCount', 0] },
                                { $round: [{ $divide: ['$totalTrainingScore', '$studentCount'] }, 2] },
                                0,
                            ],
                        },
                    },
                },
                {
                    $sort: {
                        totalTrainingScore: -1,
                        className: 1,
                    },
                },
            ],
            faculty: [
                {
                    $group: {
                        _id: '$facultyId',
                        facultyId: { $first: '$facultyId' },
                        facultyName: { $first: '$facultyName' },
                        classIds: { $addToSet: '$classId' },
                        studentCount: { $sum: 1 },
                        completedActivities: { $sum: '$completedActivities' },
                        totalTrainingScore: { $sum: '$totalTrainingScore' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        facultyId: 1,
                        facultyName: 1,
                        classCount: {
                            $size: {
                                $filter: {
                                    input: '$classIds',
                                    as: 'cid',
                                    cond: { $ne: ['$$cid', ''] },
                                },
                            },
                        },
                        studentCount: 1,
                        completedActivities: 1,
                        totalTrainingScore: 1,
                        averageTrainingScore: {
                            $cond: [
                                { $gt: ['$studentCount', 0] },
                                { $round: [{ $divide: ['$totalTrainingScore', '$studentCount'] }, 2] },
                                0,
                            ],
                        },
                    },
                },
                {
                    $sort: {
                        totalTrainingScore: -1,
                        facultyName: 1,
                    },
                },
            ],
        };

        const selectedViewPipeline = viewPipelines[filter.view];

        const pipeline: PipelineStage[] = [
            ...basePipeline,
            ...selectedViewPipeline,
            {
                $facet: {
                    items: [
                        { $skip: skip },
                        { $limit: filter.limit },
                    ],
                    totalCount: [
                        { $count: 'count' },
                    ],
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalTrainingScore: { $sum: '$totalTrainingScore' },
                                totalCompletedActivities: { $sum: '$completedActivities' },
                                totalStudents: {
                                    $sum: {
                                        $cond: [
                                            { $ifNull: ['$studentCount', false] },
                                            '$studentCount',
                                            1,
                                        ],
                                    },
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalTrainingScore: 1,
                                totalCompletedActivities: 1,
                                totalStudents: 1,
                                averageTrainingScore: {
                                    $cond: [
                                        { $gt: ['$totalStudents', 0] },
                                        { $round: [{ $divide: ['$totalTrainingScore', '$totalStudents'] }, 2] },
                                        0,
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        ];

        const [result] = await this.checkinModel.aggregate<{
            items: Array<TrainingScoreStudentItem | TrainingScoreClassItem | TrainingScoreFacultyItem>;
            totalCount: Array<{ count: number }>;
            summary: TrainingScoreReportSummary[];
        }>(pipeline).exec();

        return {
            items: result?.items || [],
            total: result?.totalCount?.[0]?.count || 0,
            summary: result?.summary?.[0] || {
                totalTrainingScore: 0,
                totalCompletedActivities: 0,
                totalStudents: 0,
                averageTrainingScore: 0,
            },
        };
    }

    async findStudentStatsRecords(filter: StudentStatsFilter): Promise<StudentStatsRecord[]> {
        const matchCheckin: PipelineStage.Match['$match'] = {
            status: { $in: [CheckinStatus.SUCCESS, CheckinStatus.LATE] },
            createdAt: {
                $gte: filter.startDate,
                $lte: filter.endDate,
            },
        };

        const pipeline: PipelineStage[] = [
            { $match: matchCheckin },
            {
                $lookup: {
                    from: 'checkinsessions',
                    localField: 'checkinSessionId',
                    foreignField: '_id',
                    as: 'session',
                },
            },
            { $unwind: { path: '$session', preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: 'activities',
                    localField: 'session.activityId',
                    foreignField: '_id',
                    as: 'activity',
                },
            },
            { $unwind: { path: '$activity', preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: 'students',
                    localField: 'userId',
                    foreignField: 'userId',
                    as: 'student',
                },
            },
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: false } },
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
        ];

        if (filter.facultyId && Types.ObjectId.isValid(filter.facultyId)) {
            pipeline.push({
                $match: {
                    'faculty._id': new Types.ObjectId(filter.facultyId),
                },
            });
        }

        if (filter.classId && Types.ObjectId.isValid(filter.classId)) {
            pipeline.push({
                $match: {
                    'class._id': new Types.ObjectId(filter.classId),
                },
            });
        }

        pipeline.push(
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        activityId: '$activity._id',
                    },
                    studentId: { $first: '$userId' },
                    name: { $first: '$user.name' },
                    studentCode: { $first: '$student.studentCode' },
                    className: { $first: '$class.name' },
                    activityTitle: { $first: '$activity.title' },
                    trainingScore: {
                        $first: {
                            $add: [
                                { $ifNull: ['$activity.trainingScore', 0] },
                                { $ifNull: ['$trainingScoreDelta', 0] },
                            ],
                        },
                    },
                    firstCheckinAt: { $min: '$createdAt' },
                },
            },
            {
                $project: {
                    _id: 0,
                    studentId: { $toString: '$studentId' },
                    name: { $ifNull: ['$name', 'Unknown'] },
                    studentCode: { $ifNull: ['$studentCode', 'N/A'] },
                    className: { $ifNull: ['$className', 'N/A'] },
                    activityTitle: { $ifNull: ['$activityTitle', 'N/A'] },
                    trainingScore: 1,
                    firstCheckinAt: 1,
                },
            },
        );

        return this.checkinModel.aggregate<StudentStatsRecord>(pipeline).exec();
    }
}
