import { Body, Controller, Post, UseGuards, Get, Param, NotFoundException, Patch, Req, UnauthorizedException } from '@nestjs/common';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { CheckinSessionService } from './checkin-session.service';
import { CreateCheckinSessionDto } from './dtos/create.checkin-session.dto';
import { UpdateCheckinSessionDto } from './dtos/update.checkin-session.dto';
import type { Request } from 'express';

@Controller('checkin-sessions')
export class CheckinSessionController {
    constructor(private readonly checkinSessionService: CheckinSessionService) { }

    @ResponseMessage('Tạo phiên điểm danh thành công')
    @UseGuards(AuthGuard)
    @Post()
    create(@Body() createCheckinSessionDto: CreateCheckinSessionDto) {
        return this.checkinSessionService.create(createCheckinSessionDto);
    }

    @ResponseMessage('Lấy phiên điểm danh thành công')
    @Get('activity/:activityId')
    async getByActivityId(@Param('activityId') activityId: string) {
        const checkinSession = await this.checkinSessionService.findByActivityId(activityId);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy phiên điểm danh cho hoạt động này');
        }
        return checkinSession;
    }

    @ResponseMessage('Lấy danh sách phiên điểm danh thành công')
    @Get('activity/:activityId/list')
    async getListByActivityId(@Param('activityId') activityId: string) {
        return this.checkinSessionService.findAllByActivityId(activityId);
    }

    @ResponseMessage('Lấy phiên điểm danh thành công')
    @Get(':id')
    async getById(@Param('id') id: string) {
        const checkinSession = await this.checkinSessionService.findById(id);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy phiên điểm danh với ID đã cho');
        }
        return checkinSession;
    }

    @ResponseMessage('Cập nhật phiên điểm danh thành công')
    @UseGuards(AuthGuard)
    @Patch(':id')
    async updateById(
        @Param('id') id: string,
        @Body() updateCheckinSessionDto: UpdateCheckinSessionDto,
        @Req() req: Request,
    ) {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        if (!actorUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.checkinSessionService.update(id, updateCheckinSessionDto, actorUserId, actorRole);
    }
}
