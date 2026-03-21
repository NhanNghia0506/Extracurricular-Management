import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { ActivityFeedbackService } from './activity-feedback.service';
import { CreateActivityFeedbackDto } from './dtos/create-activity-feedback.dto';
import { ListActivityFeedbackDto } from './dtos/list-activity-feedback.dto';
import { UpdateActivityFeedbackDto } from './dtos/update-activity-feedback.dto';

@Controller()
@UseGuards(AuthGuard)
export class ActivityFeedbackController {
    constructor(private readonly activityFeedbackService: ActivityFeedbackService) { }

    @Post('activities/:activityId/feedback')
    @ResponseMessage('Gửi đánh giá hoạt động thành công')
    async create(
        @Param('activityId') activityId: string,
        @Body() createDto: CreateActivityFeedbackDto,
        @Req() req: Request,
    ) {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.activityFeedbackService.create(activityId, createDto, currentUserId, req.user?.role);
    }

    @Patch('activity-feedback/:feedbackId')
    @ResponseMessage('Cập nhật đánh giá hoạt động thành công')
    async update(
        @Param('feedbackId') feedbackId: string,
        @Body() updateDto: UpdateActivityFeedbackDto,
        @Req() req: Request,
    ) {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.activityFeedbackService.update(feedbackId, updateDto, currentUserId);
    }

    @Get('activities/:activityId/feedback')
    @ResponseMessage('Lấy danh sách đánh giá hoạt động thành công')
    async listByActivity(
        @Param('activityId') activityId: string,
        @Query() query: ListActivityFeedbackDto,
        @Req() req: Request,
    ) {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.activityFeedbackService.listByActivity(activityId, query, currentUserId, req.user?.role);
    }

    @Get('activities/:activityId/feedback/dashboard')
    @ResponseMessage('Lấy dashboard đánh giá hoạt động thành công')
    async getDashboard(
        @Param('activityId') activityId: string,
        @Req() req: Request,
    ) {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.activityFeedbackService.getDashboard(activityId, currentUserId, req.user?.role);
    }
}
