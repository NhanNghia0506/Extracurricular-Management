import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dtos/create.checkin.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('checkins')
export class CheckinController {
    constructor(private readonly checkinService: CheckinService) { }

    @Post()
    @UseGuards(AuthGuard)
    create(@Body() createCheckinDto: CreateCheckinDto) {
        return this.checkinService.create(createCheckinDto);
    }
}
