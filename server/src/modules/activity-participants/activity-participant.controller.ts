import { Controller, Post, Body, Req, UseGuards, UnauthorizedException } from "@nestjs/common";
import { ActivityParticipantService } from "./activity-participant.service";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";
import { AuthGuard } from "src/guards/auth.guard";
import type { Request } from "express";

@Controller("activity-participants")
export class ActivityParticipantController {
    constructor(
        private readonly activityParticipantService: ActivityParticipantService
    ) { }
    @UseGuards(AuthGuard)
    @Post()
    create(@Body() createActivityParticipantDto: CreateActivityParticipantDto, @Req() req: Request) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.activityParticipantService.create(createActivityParticipantDto, userId);
    }
}
