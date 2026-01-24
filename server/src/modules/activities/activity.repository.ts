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
}
