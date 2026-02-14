import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
}
