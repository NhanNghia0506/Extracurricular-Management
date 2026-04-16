import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { ComplaintService } from './complaint.service';
import { CreateComplaintResponseDto } from './dtos/create-complaint-response.dto';
import { ListComplaintsDto } from './dtos/list-complaints.dto';
import { ReviewComplaintDto } from './dtos/review-complaint.dto';

@Controller('admin/complaints')
@UseGuards(AuthGuard)
export class ComplaintAdminController {
    constructor(private readonly complaintService: ComplaintService) { }

    private ensureOrganizerId(organizerId?: string): string {
        const normalized = organizerId?.trim();
        if (!normalized) {
            throw new BadRequestException('Vui lòng cung cấp organizerId để thao tác khiếu nại theo tổ chức');
        }

        return normalized;
    }

    @Get()
    @ResponseMessage('Lấy danh sách khiếu nại thành công')
    async list(@Query() query: ListComplaintsDto, @Req() req: Request): Promise<unknown> {
        const organizerId = this.ensureOrganizerId(query.organizerId);
        return this.complaintService.listAdmin({ ...query, organizerId }, req.user?.id);
    }

    @Get('dashboard')
    @ResponseMessage('Lấy dashboard khiếu nại thành công')
    async getDashboard(@Query('organizerId') organizerId: string | undefined, @Req() req: Request): Promise<unknown> {
        return this.complaintService.getDashboard(req.user?.id, this.ensureOrganizerId(organizerId));
    }

    @Get(':id')
    @ResponseMessage('Lấy chi tiết khiếu nại thành công')
    async getById(@Param('id') id: string, @Query('organizerId') organizerId: string | undefined, @Req() req: Request): Promise<unknown> {
        return this.complaintService.getAdminById(id, req.user?.id, this.ensureOrganizerId(organizerId));
    }

    @Get(':id/responses')
    @ResponseMessage('Lấy phản hồi khiếu nại thành công')
    async getResponses(@Param('id') id: string, @Query('organizerId') organizerId: string | undefined, @Req() req: Request): Promise<unknown> {
        return this.complaintService.listAdminResponses(id, req.user?.id, this.ensureOrganizerId(organizerId));
    }

    @Post(':id/responses')
    @ResponseMessage('Gửi phản hồi xử lý khiếu nại thành công')
    async addResponse(
        @Param('id') id: string,
        @Body() payload: CreateComplaintResponseDto,
        @Query('organizerId') organizerId: string | undefined,
        @Req() req: Request,
    ): Promise<unknown> {
        return this.complaintService.addAdminResponse(id, req.user!.id!, this.ensureOrganizerId(organizerId), payload);
    }

    @Get(':id/history')
    @ResponseMessage('Lấy lịch sử xử lý khiếu nại thành công')
    async getHistory(@Param('id') id: string, @Query('organizerId') organizerId: string | undefined, @Req() req: Request): Promise<unknown> {
        return this.complaintService.listAdminHistory(id, req.user?.id, this.ensureOrganizerId(organizerId));
    }

    @Patch(':id/review')
    @ResponseMessage('Xử lý khiếu nại thành công')
    async review(
        @Param('id') id: string,
        @Body() reviewDto: ReviewComplaintDto,
        @Query('organizerId') organizerId: string | undefined,
        @Req() req: Request,
    ): Promise<unknown> {
        return this.complaintService.review(id, req.user!.id!, this.ensureOrganizerId(organizerId), reviewDto);
    }
}
