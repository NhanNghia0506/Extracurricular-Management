import { Controller, Post, Body, Req, UseGuards, UnauthorizedException, Get, Param } from "@nestjs/common";
import { ActivityParticipantService } from "./activity-participant.service";
import { CreateActivityParticipantDto } from "./dtos/create.activity-participant.dto";
import { AuthGuard } from "src/guards/auth.guard";
import type { Request } from "express";
import { UserRole } from "src/global/globalEnum";

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

    @UseGuards(AuthGuard)
    @Get('participantsByActivity/:activityId')
    getParticipantsByActivity(@Param('activityId') activityId: string, @Req() req: Request) {
        const role = req.user?.role;
        if (role !== UserRole.USER && role !== UserRole.ADMIN)
            throw new UnauthorizedException('Bạn không có quyền truy cập vào chức năng này!');
        return this.activityParticipantService.findByActivityIdWithStudentInfo(activityId);
    }
}
