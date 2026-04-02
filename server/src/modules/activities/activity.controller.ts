import {
    Controller,
    Post,
    Body,
    UseInterceptors,
    UploadedFile,
    Get,
    Param,
    UseGuards,
    Query,
    BadRequestException,
    Request,
    Req,
    Put,
    Delete,
    Patch,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dtos/create.activity.dto';
import { UpdateActivityDto } from './dtos/update.activity.dto';
import { createUploadImageInterceptor } from '../../interceptors/upload-image.interceptor';
import { UploadService } from '../../interceptors/upload.service';
import { Activity } from './activity.entity';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { ActivityDetailResponse } from 'src/global/globalInterface';
import { AuthGuard } from "src/guards/auth.guard";
import { OrganizerManagerGuard } from 'src/guards/organizer.manager.guard';
import type { Request as ExpressRequest } from 'express';
import { OptionalAuthGuard } from 'src/guards/optional-auth.guard';
import {
    ActivityApprovalDashboardResponse,
    ActivityApprovalDetailResponse,
} from 'src/global/globalInterface';
import { ActivityApprovalQueryDto } from './dtos/activity-approval-query.dto';
import { UpdateActivityApprovalDto } from './dtos/update-activity-approval.dto';
import { SendActivityNotificationDto } from './dtos/send-activity-notification.dto';
import { ActivityRecommendationQueryDto } from './dtos/activity-recommendation-query.dto';


@Controller('activities')
export class ActivityController {
    constructor(
        private readonly activityService: ActivityService,
        private readonly uploadService: UploadService,
    ) { }

    /**
     * Tạo activity mới với upload ảnh
     * Endpoint: POST /activities?organizerId=...&categoryId=...
     * Form-data:
     *   - title: string (bắt buộc)
     *   - description: string (bắt buộc)
     *   - location: string (bắt buộc)
     *   - status: ActivityStatus (tùy chọn)
     *   - organizerId: string (bắt buộc, query)
     *   - categoryId: string (bắt buộc, query)
     *   - image: file (tùy chọn, max 5MB)
     */
    @ResponseMessage('Tạo hoạt động thành công')
    @Post()
    @UseInterceptors(createUploadImageInterceptor())
    @UseGuards(AuthGuard, OrganizerManagerGuard)
    async create(
        @Body() createActivityDto: CreateActivityDto,
        @Request() req: ExpressRequest,
        @UploadedFile() file: Express.Multer.File | undefined,
        @Query('organizerId') organizerId: string,
        @Query('categoryId') categoryId: string,
    ): Promise<Activity> {
        if (!organizerId) {
            throw new BadRequestException('organizerId is required');
        }

        if (!categoryId) {
            throw new BadRequestException('categoryId is required');
        }

        createActivityDto.organizerId = organizerId;
        createActivityDto.categoryId = categoryId;

        const uploadedFilename = file?.filename;

        try {
            // Parse location string thành object nếu cần
            if (typeof createActivityDto.location === 'string') {
                try {
                    createActivityDto.location = JSON.parse(createActivityDto.location) as typeof createActivityDto.location;
                } catch (e) {
                    console.error('Lỗi parse location:', e);
                    throw new Error('Location format không hợp lệ');
                }
            }

            // Nếu có file upload, thêm vào DTO
            if (file) {
                createActivityDto.image = file.filename;
            }

            return await this.activityService.create(req.user!.id!, req.user?.role, createActivityDto);
        } catch (error) {
            // Xóa file nếu tạo activity thất bại
            if (uploadedFilename) {
                this.uploadService.deleteFile(uploadedFilename);
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách hoạt động
     * Endpoint: GET /activities
     */
    @ResponseMessage('Lấy danh sách hoạt động thành công')
    @Get()
    @UseGuards(OptionalAuthGuard)
    async findAll(@Req() req: ExpressRequest): Promise<Array<Activity & { isMine: boolean }>> {
        return this.activityService.findAll(req.user?.id);
    }

    @ResponseMessage('Lấy dashboard duyệt hoạt động thành công')
    @Get('admin/approval')
    @UseGuards(AuthGuard)
    async getApprovalDashboard(
        @Req() req: ExpressRequest,
        @Query() query: ActivityApprovalQueryDto,
    ): Promise<ActivityApprovalDashboardResponse> {
        return this.activityService.getApprovalDashboard(req.user?.role, query.approvalStatus);
    }

    @ResponseMessage('Lấy danh sách hoạt động gợi ý thành công')
    @Get('recommended')
    @UseGuards(AuthGuard)
    async getRecommendedActivities(
        @Req() req: ExpressRequest,
        @Query() query: ActivityRecommendationQueryDto,
    ): Promise<{ strategy: 'hybrid'; items: unknown[] }> {
        return this.activityService.getRecommendations(req.user!.id!, query);
    }

    @ResponseMessage('Lấy chi tiết duyệt hoạt động thành công')
    @Get('admin/approval/:id')
    @UseGuards(AuthGuard)
    async getApprovalDetail(
        @Param('id') id: string,
        @Req() req: ExpressRequest,
    ): Promise<ActivityApprovalDetailResponse> {
        return this.activityService.getApprovalDetail(id, req.user?.role);
    }

    @ResponseMessage('Cập nhật trạng thái duyệt hoạt động thành công')
    @Patch('admin/approval/:id')
    @UseGuards(AuthGuard)
    async reviewActivity(
        @Param('id') id: string,
        @Body() reviewDto: UpdateActivityApprovalDto,
        @Req() req: ExpressRequest,
    ): Promise<ActivityApprovalDetailResponse> {
        return this.activityService.reviewActivity(id, req.user!.id!, req.user?.role, reviewDto);
    }

    @ResponseMessage('Lấy danh sách hoạt động của tôi thành công')
    @Get('my-activities')
    @UseGuards(AuthGuard)
    async getMyActivities(
        @Req() req: ExpressRequest,
    ): Promise<Array<Activity & { relation: 'created' | 'participated' }>> {
        return this.activityService.getMyActivities(req.user!.id!);
    }

    // Lấy ra chi tiết một hoạt động bao gồm cả số lượng người tham gia
    @ResponseMessage('Lấy chi tiết hoạt động thành công')
    @Get(':id')
    @UseGuards(AuthGuard)
    async getActivityById(@Param('id') id: string, @Req() req: ExpressRequest): Promise<ActivityDetailResponse | null> {
        return this.activityService.findActivityDetailById(id, req.user?.id, req.user?.role);
    }

    @ResponseMessage('Gửi thông báo cho thành viên hoạt động thành công')
    @Post(':id/notifications')
    @UseGuards(AuthGuard)
    async sendActivityNotification(
        @Param('id') id: string,
        @Body() payload: SendActivityNotificationDto,
        @Req() req: ExpressRequest,
    ) {
        return this.activityService.sendNotificationToParticipants(
            id,
            req.user!.id!,
            req.user?.role,
            payload,
        );
    }

    /**
     * Cập nhật activity - chỉ chủ sở hữu mới có thể cập nhật
     * Endpoint: PUT /activities/:id
     * Form-data:
     *   - title: string (tùy chọn)
     *   - description: string (tùy chọn)
     *   - location: object (tùy chọn)
     *   - status: ActivityStatus (tùy chọn)
     *   - startAt: Date (tùy chọn)
     *   - endAt: Date (tùy chọn)
     *   - trainingScore: number (tùy chọn)
     *   - participantCount: number (tùy chọn)
     *   - image: file (tùy chọn - xóa ảnh cũ, lưu ảnh mới)
     */
    @ResponseMessage('Cập nhật hoạt động thành công')
    @Put(':id')
    @UseInterceptors(createUploadImageInterceptor())
    @UseGuards(AuthGuard)
    async update(
        @Param('id') id: string,
        @Body() updateActivityDto: UpdateActivityDto,
        @Request() req: ExpressRequest,
        @UploadedFile() file: Express.Multer.File | undefined,
    ): Promise<Activity> {
        const userId = req.user!.id!;
        const uploadedFilename = file?.filename;

        try {
            // Parse location string thành object nếu cần
            if (updateActivityDto.location && typeof updateActivityDto.location === 'string') {
                try {
                    updateActivityDto.location = JSON.parse(updateActivityDto.location) as typeof updateActivityDto.location;
                } catch (e) {
                    console.error('Lỗi parse location:', e);
                    throw new Error('Location format không hợp lệ');
                }
            }

            return await this.activityService.update(id, userId, req.user?.role, updateActivityDto, uploadedFilename);
        } catch (error) {
            // Xóa file nếu cập nhật thất bại
            if (uploadedFilename) {
                this.uploadService.deleteFile(uploadedFilename);
            }
            throw error;
        }
    }

    @ResponseMessage('Xóa hoạt động thành công')
    @Delete(':id')
    @UseGuards(AuthGuard)
    async delete(
        @Param('id') id: string,
        @Req() req: ExpressRequest,
    ): Promise<Activity> {
        return this.activityService.delete(id, req.user!.id!, req.user?.role);
    }
}
