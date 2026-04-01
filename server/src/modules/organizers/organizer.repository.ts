import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Organizer } from "./organizer.entity";
import { Model, PipelineStage, Types } from "mongoose";
import { ActivityApprovalStatus, OrganizerApprovalStatus } from "src/global/globalEnum";

export interface OrganizerUserReference {
    _id?: Types.ObjectId;
    name?: string;
    email?: string;
}

export interface OrganizerApprovalRecord extends Omit<Organizer, 'createdBy' | 'reviewedBy'> {
    _id: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy: Types.ObjectId | OrganizerUserReference;
    reviewedBy?: Types.ObjectId | OrganizerUserReference | null;
}

export interface OrganizerStatsFilter {
    startDate: Date;
    endDate: Date;
}

export interface OrganizerStatsRecord {
    organizerId: string;
    organizerName: string;
    activityId: string;
    activityTitle: string;
    activityDate: Date;
    categoryName: string;
    participantCount: number;
    averageRating: number;
}

@Injectable()
export class OrganizerRepository {
    constructor(
        @InjectModel(Organizer.name) private readonly organizerModel: Model<Organizer>,
    ) { }

    create(organizer: Partial<Organizer>) {
        return this.organizerModel.create(organizer);
    }

    findAll() {
        return this.organizerModel.find().exec();
    }

    findById(id: string) {
        return this.organizerModel.findById(id).exec();
    }

    findAllForApproval(approvalStatus?: OrganizerApprovalStatus): Promise<OrganizerApprovalRecord[]> {
        const filter = approvalStatus ? { approvalStatus } : {};
        return this.organizerModel
            .find(filter)
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .sort({ isPriority: -1, createdAt: -1 })
            .exec() as Promise<OrganizerApprovalRecord[]>;
    }

    findApprovalById(id: string): Promise<OrganizerApprovalRecord | null> {
        return this.organizerModel
            .findById(id)
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .exec() as Promise<OrganizerApprovalRecord | null>;
    }

    countByApprovalStatus(approvalStatus: OrganizerApprovalStatus): Promise<number> {
        return this.organizerModel.countDocuments({ approvalStatus }).exec();
    }

    async findOrganizerStatsRecords(filter: OrganizerStatsFilter): Promise<OrganizerStatsRecord[]> {
        const pipeline: PipelineStage[] = [
            {
                $lookup: {
                    from: 'activities',
                    localField: '_id',
                    foreignField: 'organizerId',
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
                    'activity.createdAt': {
                        $gte: filter.startDate,
                        $lte: filter.endDate,
                    },
                    'activity.approvalStatus': ActivityApprovalStatus.APPROVED,
                },
            },
            {
                $lookup: {
                    from: 'activitycategories',
                    localField: 'activity.categoryId',
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
                    let: { activityId: '$activity._id' },
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
                    let: { activityId: '$activity._id' },
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
                    organizerId: { $toString: '$_id' },
                    organizerName: '$name',
                    activityId: { $toString: '$activity._id' },
                    activityTitle: { $ifNull: ['$activity.title', 'N/A'] },
                    activityDate: '$activity.createdAt',
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

        return this.organizerModel.aggregate<OrganizerStatsRecord>(pipeline).exec();
    }

    update(id: string, organizer: Partial<Organizer>) {
        return this.organizerModel.findByIdAndUpdate(id, organizer, { new: true }).exec();
    }

    delete(id: string) {
        return this.organizerModel.findByIdAndDelete(id).exec();
    }
}
