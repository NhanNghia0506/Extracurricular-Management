import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Activity } from "./activity.entity";
import { Model, Types } from "mongoose";
import { ActivityApprovalStatus, ActivityStatus } from "src/global/globalEnum";

export interface ActivityNamedReference {
    _id?: Types.ObjectId;
    name?: string;
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
            .populate('organizerId', 'name')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .lean<Array<Activity & { _id: Types.ObjectId }>>()
            .exec();
    }

    findUpcomingActivities(now: Date): Promise<Array<Activity & { _id: Types.ObjectId }>> {
        return this.activityModel
            .find({
                status: { $nin: ['CANCELLED', 'COMPLETED'] },
                startAt: { $gt: now },
            })
            .select('_id title startAt')
            .lean<Array<Activity & { _id: Types.ObjectId }>>()
            .exec();
    }

    findById(id: string) {
        return this.activityModel
            .findById(id)
            .populate('organizerId', 'name')
            .populate('categoryId', 'name')
            .exec();
    }

    findByUserId(userId: string): Promise<Array<Activity & { _id: any }>> {
        return this.activityModel
            .find({ createdBy: new Types.ObjectId(userId) })
            .populate('organizerId', 'name')
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
}
