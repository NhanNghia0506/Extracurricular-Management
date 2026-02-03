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

}
