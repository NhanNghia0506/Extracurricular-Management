import { Body, Controller, Post, UseGuards, Get, Param, NotFoundException } from '@nestjs/common';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { CheckinSessionService } from './checkin-session.service';
import { CreateCheckinSessionDto } from './dtos/create.checkin-session.dto';

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
    @Get(':id')
    async getById(@Param('id') id: string) {
        const checkinSession = await this.checkinSessionService.findById(id);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy phiên điểm danh với ID đã cho');
        }
        return checkinSession;
    }
}
