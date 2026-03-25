import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dtos/create.checkin.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CheckinStatus } from 'src/global/globalEnum';
import type { Request } from 'express';
import { ManualCheckinDto } from './dtos/manual.checkin.dto';
import { MyAttendanceHistoryQueryDto } from './dtos/my-attendance-history.query.dto';
import { TrainingScoreReportQueryDto } from './dtos/training-score-report.query.dto';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('checkins')
export class CheckinController {
    constructor(private readonly checkinService: CheckinService) { }

    @Post()
    @UseGuards(AuthGuard)
    create(@Body() createCheckinDto: CreateCheckinDto, @Req() req: Request) {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        if (!actorUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.checkinService.create(createCheckinDto, actorUserId, actorRole);
    }

    @Post('manual')
    @UseGuards(AuthGuard)
    createManual(@Body() manualCheckinDto: ManualCheckinDto, @Req() req: Request) {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        if (!actorUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.checkinService.createManual(manualCheckinDto, actorUserId, actorRole);
    }

    /**
     * Lấy danh sách người đã checkin theo sessionId
     * GET /checkins/session/:sessionId?status=SUCCESS
     */
    @Get('session/:sessionId')
    // @UseGuards(AuthGuard)
    async getCheckinsBySessionId(
        @Param('sessionId') sessionId: string,
        @Query('status') status?: CheckinStatus,
    ) {
        return await this.checkinService.getCheckinsBySessionId(sessionId, status);
    }

    @Get('my-history')
    @UseGuards(AuthGuard)
    async getMyHistory(
        @Req() req: Request,
        @Query() query: MyAttendanceHistoryQueryDto,
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.checkinService.getMyAttendanceHistory(userId, query);
    }

    @Get('admin/training-score-report')
    @UseGuards(AuthGuard, AdminGuard)
    async getTrainingScoreReport(@Query() query: TrainingScoreReportQueryDto) {
        return this.checkinService.getTrainingScoreReport(query);
    }
}
