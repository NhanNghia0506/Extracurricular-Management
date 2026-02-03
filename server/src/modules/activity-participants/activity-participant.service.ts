import { Injectable } from "@nestjs/common";
import { ActivityParticipantRepository } from "./activity-participant.repository";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";
import { ActivityParticipant, ParticipantStatus } from "./activity-participant.entity";
import { Types } from "mongoose";

@Injectable()
export class ActivityParticipantService {
    constructor(
        private readonly activityParticipantRepository: ActivityParticipantRepository
    ) { }

    create(activityParticipantData: CreateActivityParticipantDto) {
        const activityParticipant = {
            activityId: new Types.ObjectId(activityParticipantData.activityId),
            userId: new Types.ObjectId(activityParticipantData.userId),
            status: activityParticipantData.status || ParticipantStatus.PENDING,
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
