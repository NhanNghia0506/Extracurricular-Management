import { 
    Controller, 
    Get, 
    Post, 
    Patch, 
    Delete, 
    Body, 
    Param, 
    Query, 
    Req,
    UseGuards,
    UnauthorizedException 
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { GetNotificationsQueryDto } from './dtos/get-notifications-query.dto';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService
    ) { }

    @ResponseMessage('Lấy danh sách thông báo thành công')
    @Get()
    async getNotifications(
        @Req() req: Request,
        @Query() query: GetNotificationsQueryDto
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.notificationService.getNotifications(userId, query);
    }

    @ResponseMessage('Lấy số lượng thông báo chưa đọc thành công')
    @Get('unread/count')
    async getUnreadCount(@Req() req: Request) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.notificationService.getUnreadCount(userId);
    }

    @ResponseMessage('Lấy chi tiết thông báo thành công')
    @Get(':id')
    async getNotificationById(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.notificationService.getNotificationById(id, userId);
    }

    @ResponseMessage('Tạo thông báo thành công')
    @Post()
    async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationService.create(createNotificationDto);
    }

    @ResponseMessage('Đánh dấu thông báo đã đọc thành công')
    @Patch(':id/read')
    async markAsRead(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.notificationService.markAsRead(id, userId);
    }

    @ResponseMessage('Đánh dấu tất cả thông báo đã đọc thành công')
    @Patch('mark-all/read')
    async markAllAsRead(@Req() req: Request) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.notificationService.markAllAsRead(userId);
    }

    @ResponseMessage('Xóa thông báo thành công')
    @Delete(':id')
    async deleteNotification(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.notificationService.deleteNotification(id, userId);
    }
}
