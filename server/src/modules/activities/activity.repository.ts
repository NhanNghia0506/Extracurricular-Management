import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Activity } from "./activity.entity";
import { Model } from "mongoose";


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
            .find()
            .populate('organizerId', 'name')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    findById(id: string) {
        return this.activityModel
            .findById(id)
            .populate('organizerId', 'name')
            .populate('categoryId', 'name')
            .exec();
    }
}
