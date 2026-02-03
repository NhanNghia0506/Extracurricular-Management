import { Injectable } from "@nestjs/common";
import { ActivityParticipantRepository } from "./activity-participant.repository";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";
import { ActivityParticipant } from "./activity-participant.entity";
import { Types } from "mongoose";

@Injectable()
export class ActivityParticipantService {
    constructor(
        private readonly activityParticipantRepository: ActivityParticipantRepository
    ) { }

    create(activityParticipantData: CreateActivityParticipantDto, userId: string) {
        const activityParticipant = {
            activityId: new Types.ObjectId(activityParticipantData.activityId),
            userId: new Types.ObjectId(userId),
            status: activityParticipantData.status,
            approvedBy: activityParticipantData.approvedBy
                ? new Types.ObjectId(activityParticipantData.approvedBy)
                : null,
            approvedAt: activityParticipantData.approvedAt || null,
            registeredAt: activityParticipantData.registeredAt || new Date(),
        } as ActivityParticipant;

        return this.activityParticipantRepository.create(activityParticipant);
    }

    countParticipantsByActivity(activityId: string) {
        return this.activityParticipantRepository.countByActivityId(activityId);
    }
}
