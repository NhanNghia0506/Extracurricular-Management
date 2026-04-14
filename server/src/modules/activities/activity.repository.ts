import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Activity } from "./activity.entity";
import { Model, PipelineStage, Types } from "mongoose";
import { ActivityApprovalStatus, ActivityStatus } from "src/global/globalEnum";

export interface ActivityNamedReference {
    _id?: Types.ObjectId;
    name?: string;
    image?: string;
}

export interface ActivityUserReference extends ActivityNamedReference {
    email?: string;
}

export interface ActivityApprovalRecord extends Omit<Activity, 'organizerId' | 'categoryId' | 'createdBy' | 'reviewedBy'> {
    _id: Types.ObjectId;
    organizerId: ActivityNamedReference;
    categoryId: ActivityNamedReference;
    createdBy: Types.ObjectId | ActivityUserReference;
    reviewedBy?: ActivityUserReference | null;
}

export interface RecommendationCandidateRecord {
    _id: Types.ObjectId;
    title: string;
    description: string;
    image?: string;
    location?: Activity['location'];
    status: ActivityStatus;
    startAt: Date;
    endAt?: Date;
    trainingScore: number;
    participantCount: number;
    isPriority: boolean;
    organizerId: { _id?: Types.ObjectId; name?: string; image?: string } | null;
    categoryId: { _id?: Types.ObjectId; name?: string } | null;
    averageRating: number;
    ratingCount: number;
    cohortCount: number;
}

export interface ActivityStatsFilter {
    startDate: Date;
    endDate: Date;
}

export interface ActivityStatsRecord {
    activityId: string;
    title: string;
    status: ActivityStatus;
    startAt: Date;
    endAt?: Date;
    categoryName: string;
    participantCount: number;
    averageRating: number;
}

interface JoinedActivityRow {
    activityId?: Types.ObjectId;
}

interface StudentAcademicContextRow {
    classId?: Types.ObjectId;
    facultyId?: Types.ObjectId;
}

interface CategoryAffinityRow {
    _id?: Types.ObjectId;
    count?: number;
}


@Injectable()
export class ActivityRepository {
    constructor(
        @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
    ) { }

    create(activity: Partial<Activity>): Promise<Activity> {
        return this.activityModel.create(activity);
    }

    findAll(): Promise<Array<Activity & { _id: any }>> {
        return this.activityModel
            .find({ approvalStatus: ActivityApprovalStatus.APPROVED })
            .populate('organizerId', 'name image')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .lean<Array<Activity & { _id: Types.ObjectId }>>()
            .exec();
    }

    findUpcomingActivities(now: Date): Promise<Array<Activity & { _id: Types.ObjectId }>> {
        return this.activityModel
            .find({
                approvalStatus: ActivityApprovalStatus.APPROVED,
                status: { $nin: ['CANCELLED', 'COMPLETED'] },
                startAt: { $gt: now },
            })
            .select('_id title startAt organizerId')
            .lean<Array<Activity & { _id: Types.ObjectId }>>()
            .exec();
    }

    findById(id: string) {
        return this.activityModel
            .findById(id)
            .populate('organizerId', 'name image')
            .populate('categoryId', 'name')
            .exec();
    }

    async findIdsByOrganizerId(organizerId: string): Promise<string[]> {
        if (!Types.ObjectId.isValid(organizerId)) {
            return [];
        }

        const rows = await this.activityModel
            .find({ organizerId: new Types.ObjectId(organizerId) })
            .select('_id')
            .lean<{ _id: Types.ObjectId }[]>()
            .exec();

        return rows.map((row) => row._id.toString());
    }

    findByUserId(userId: string): Promise<Array<Activity & { _id: any }>> {
        return this.activityModel
            .find({ createdBy: new Types.ObjectId(userId) })
            .populate('organizerId', 'name image')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .lean<Array<Activity & { _id: Types.ObjectId }>>()
            .exec();
    }

    findActivitiesStartingBetween(start: Date, end: Date): Promise<Array<Activity & { _id: Types.ObjectId }>> {
        return this.activityModel
            .find({
                approvalStatus: ActivityApprovalStatus.APPROVED,
                status: { $nin: [ActivityStatus.CANCELLED, ActivityStatus.COMPLETED] },
                startAt: {
                    $gte: start,
                    $lte: end,
                },
            })
            .select('_id title startAt')
            .lean<Array<Activity & { _id: Types.ObjectId }>>()
            .exec();
    }

    findAllForApproval(approvalStatus?: ActivityApprovalStatus): Promise<ActivityApprovalRecord[]> {
        const filter = approvalStatus ? { approvalStatus } : {};
        return this.activityModel
            .find(filter)
            .populate('organizerId', 'name')
            .populate('categoryId', 'name')
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .sort({ isPriority: -1, createdAt: -1 })
            .lean<ActivityApprovalRecord[]>()
            .exec();
    }

    findApprovalById(id: string): Promise<ActivityApprovalRecord | null> {
        return this.activityModel
            .findById(id)
            .populate('organizerId', 'name')
            .populate('categoryId', 'name')
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .lean<ActivityApprovalRecord | null>()
            .exec();
    }

    countByApprovalStatus(approvalStatus: ActivityApprovalStatus): Promise<number> {
        return this.activityModel.countDocuments({ approvalStatus }).exec();
    }

    update(id: string, updateData: Partial<Activity>): Promise<Activity | null> {
        return this.activityModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('organizerId', 'name')
            .populate('categoryId', 'name')
            .exec();
    }

    delete(id: string): Promise<Activity | null> {
        return this.activityModel.findByIdAndDelete(id).exec();
    }

    async getJoinedActivityIds(userId: string): Promise<Types.ObjectId[]> {
        const rows = await this.activityModel.db.collection('activityparticipants')
            .find({ userId: new Types.ObjectId(userId) }, { projection: { activityId: 1 } })
            .toArray() as JoinedActivityRow[];

        return rows
            .map((item) => item.activityId)
            .filter((value: unknown): value is Types.ObjectId => value instanceof Types.ObjectId);
    }

    async getStudentAcademicContext(userId: string): Promise<{ classId?: Types.ObjectId; facultyId?: Types.ObjectId }> {
        const rows = await this.activityModel.db.collection('students').aggregate<StudentAcademicContextRow>([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: '_id',
                    as: 'class',
                },
            },
            {
                $unwind: {
                    path: '$class',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    classId: '$classId',
                    facultyId: '$class.facultyId',
                },
            },
        ]).toArray();

        const result = rows[0];

        if (!result) {
            return {};
        }

        return {
            classId: result.classId,
            facultyId: result.facultyId,
        };
    }

    async getUserCategoryAffinities(userId: string): Promise<Map<string, number>> {
        const rows = await this.activityModel.db.collection('activityparticipants').aggregate<CategoryAffinityRow>([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
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
            {
                $unwind: {
                    path: '$activity',
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $match: {
                    'activity.approvalStatus': ActivityApprovalStatus.APPROVED,
                },
            },
            {
                $group: {
                    _id: '$activity.categoryId',
                    count: { $sum: 1 },
                },
            },
        ]).toArray();

        const result = new Map<string, number>();
        for (const row of rows) {
            if (!row._id) {
                continue;
            }

            result.set(String(row._id), Number(row.count || 0));
        }

        return result;
    }

    async findActivityStatsRecords(filter: ActivityStatsFilter): Promise<ActivityStatsRecord[]> {
        const pipeline: PipelineStage[] = [
            {
                $match: {
                    approvalStatus: ActivityApprovalStatus.APPROVED,
                    startAt: {
                        $gte: filter.startDate,
                        $lte: filter.endDate,
                    },
                },
            },
            {
                $lookup: {
                    from: 'activitycategories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'activityparticipants',
                    let: { activityId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$activityId', '$$activityId'] },
                                        { $ne: ['$status', 'CANCELLED'] },
                                    ],
                                },
                            },
                        },
                        {
                            $count: 'participantCount',
                        },
                    ],
                    as: 'participantSummary',
                },
            },
            {
                $lookup: {
                    from: 'activityfeedbacks',
                    let: { activityId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$activityId', '$$activityId'] },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                averageRating: { $avg: '$rating' },
                            },
                        },
                    ],
                    as: 'ratingSummary',
                },
            },
            {
                $project: {
                    _id: 0,
                    activityId: { $toString: '$_id' },
                    title: { $ifNull: ['$title', 'N/A'] },
                    status: '$status',
                    startAt: '$startAt',
                    endAt: '$endAt',
                    categoryName: { $ifNull: ['$category.name', 'Không phân loại'] },
                    participantCount: {
                        $ifNull: [{ $arrayElemAt: ['$participantSummary.participantCount', 0] }, 0],
                    },
                    averageRating: {
                        $round: [{ $ifNull: [{ $arrayElemAt: ['$ratingSummary.averageRating', 0] }, 0] }, 2],
                    },
                },
            },
        ];

        return this.activityModel.aggregate<ActivityStatsRecord>(pipeline).exec();
    }

    async findRecommendationCandidates(
        userId: string,
        joinedActivityIds: Types.ObjectId[],
        classId?: Types.ObjectId,
        facultyId?: Types.ObjectId,
    ): Promise<RecommendationCandidateRecord[]> {
        const now = new Date();

        const cohortPipeline: any[] = [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$activityId', '$$activityId'] },
                            { $ne: ['$userId', '$$currentUserId'] },
                            { $ne: ['$status', 'CANCELLED'] },
                        ],
                    },
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
            {
                $unwind: {
                    path: '$student',
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'student.classId',
                    foreignField: '_id',
                    as: 'class',
                },
            },
            {
                $unwind: {
                    path: '$class',
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];

        const cohortOr: any[] = [];
        if (classId) {
            cohortOr.push({ $eq: ['$student.classId', classId] });
        }
        if (facultyId) {
            cohortOr.push({ $eq: ['$class.facultyId', facultyId] });
        }

        if (cohortOr.length > 0) {
            cohortPipeline.push({
                $match: {
                    $expr: {
                        $or: cohortOr,
                    },
                },
            });
        } else {
            cohortPipeline.push({
                $match: {
                    _id: null,
                },
            });
        }

        cohortPipeline.push({
            $count: 'cohortCount',
        });

        const pipeline: any[] = [
            {
                $match: {
                    approvalStatus: ActivityApprovalStatus.APPROVED,
                    status: { $nin: [ActivityStatus.CANCELLED, ActivityStatus.COMPLETED] },
                    startAt: { $gte: now },
                    ...(joinedActivityIds.length > 0
                        ? {
                            _id: { $nin: joinedActivityIds },
                        }
                        : {}),
                },
            },
            {
                $lookup: {
                    from: 'organizers',
                    localField: 'organizerId',
                    foreignField: '_id',
                    as: 'organizer',
                },
            },
            {
                $unwind: {
                    path: '$organizer',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'activitycategories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'activityparticipants',
                    let: { activityId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$activityId', '$$activityId'] },
                                        { $ne: ['$status', 'CANCELLED'] },
                                    ],
                                },
                            },
                        },
                        {
                            $count: 'participantCount',
                        },
                    ],
                    as: 'participantSummary',
                },
            },
            {
                $lookup: {
                    from: 'activityfeedbacks',
                    let: { activityId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$activityId', '$$activityId'] },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                averageRating: { $avg: '$rating' },
                                ratingCount: { $sum: 1 },
                            },
                        },
                    ],
                    as: 'ratingSummary',
                },
            },
            {
                $lookup: {
                    from: 'activityparticipants',
                    let: {
                        activityId: '$_id',
                        currentUserId: new Types.ObjectId(userId),
                    },
                    pipeline: cohortPipeline,
                    as: 'cohortSummary',
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    image: 1,
                    location: 1,
                    status: 1,
                    startAt: 1,
                    endAt: 1,
                    trainingScore: { $ifNull: ['$trainingScore', 0] },
                    participantCount: { $ifNull: [{ $arrayElemAt: ['$participantSummary.participantCount', 0] }, 0] },
                    isPriority: { $ifNull: ['$isPriority', false] },
                    organizerId: {
                        _id: '$organizer._id',
                        name: '$organizer.name',
                        image: '$organizer.image',
                    },
                    categoryId: {
                        _id: '$category._id',
                        name: '$category.name',
                    },
                    averageRating: {
                        $round: [{ $ifNull: [{ $arrayElemAt: ['$ratingSummary.averageRating', 0] }, 0] }, 2],
                    },
                    ratingCount: { $ifNull: [{ $arrayElemAt: ['$ratingSummary.ratingCount', 0] }, 0] },
                    cohortCount: { $ifNull: [{ $arrayElemAt: ['$cohortSummary.cohortCount', 0] }, 0] },
                },
            },
            {
                $sort: {
                    isPriority: -1,
                    startAt: 1,
                },
            },
            {
                $limit: 120,
            },
        ];

        return this.activityModel.aggregate<RecommendationCandidateRecord>(pipeline).exec();
    }
}
