import { Controller, Post, Body } from "@nestjs/common";
import { ActivityParticipantService } from "./activity-participant.service";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";

@Controller("activity-participants")
export class ActivityParticipantController {
    constructor(
        private readonly activityParticipantService: ActivityParticipantService
    ) { }

    @Post()
    create(@Body() createActivityParticipantDto: CreateActivityParticipantDto) {
        return this.activityParticipantService.create(createActivityParticipantDto);
    }
}
