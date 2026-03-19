import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Checkin } from './checkin.entity';
import { CheckinStatus } from 'src/global/globalEnum';

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
        status: CheckinStatus | CheckinStatus[],
    ) {
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
    ) {
        return this.checkinModel.findOne({
            checkinSessionId: new Types.ObjectId(checkinSessionId),
            userId: new Types.ObjectId(userId),
            status: Array.isArray(status) ? { $in: status } : status,
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
                    activityStartAt: '$activity.startAt',
                    activityEndAt: '$activity.endAt',
                    sessionId: '$session._id',
                    sessionTitle: '$session.title',
                    checkinTime: '$createdAt',
                    locationAddress: '$session.location.address',
                    status: '$status',
                    trainingScore: { $ifNull: ['$activity.trainingScore', 0] },
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
                                _id: null,
                                totalSessions: { $sum: 1 },
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
                                cumulativeTrainingScore: {
                                    $sum: {
                                        $cond: [
                                            { $in: ['$status', [CheckinStatus.SUCCESS, CheckinStatus.LATE]] },
                                            '$trainingScore',
                                            0,
                                        ],
                                    },
                                },
                                participatedActivityIds: { $addToSet: '$activityId' },
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
}
