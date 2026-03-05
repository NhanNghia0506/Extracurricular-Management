import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dtos/create.checkin.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CheckinStatus } from 'src/global/globalEnum';

@Controller('checkins')
export class CheckinController {
    constructor(private readonly checkinService: CheckinService) { }

    @Post()
    @UseGuards(AuthGuard)
    create(@Body() createCheckinDto: CreateCheckinDto) {
        return this.checkinService.create(createCheckinDto);
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
}
