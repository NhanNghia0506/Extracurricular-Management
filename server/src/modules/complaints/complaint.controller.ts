import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { createUploadImageInterceptor } from 'src/interceptors/upload-image.interceptor';
import { UploadService } from 'src/interceptors/upload.service';
import { ComplaintService } from './complaint.service';
import { CreateComplaintResponseDto } from './dtos/create-complaint-response.dto';
import { CreateComplaintDto } from './dtos/create-complaint.dto';
import { ListComplaintsDto } from './dtos/list-complaints.dto';

@Controller('complaints')
@UseGuards(AuthGuard)
export class ComplaintController {
    constructor(
        private readonly complaintService: ComplaintService,
        private readonly uploadService: UploadService,
    ) { }

    @Post('upload-attachment')
    @ResponseMessage('Tải file bằng chứng thành công')
    @UseInterceptors(createUploadImageInterceptor())
    uploadAttachment(@UploadedFile() file?: Express.Multer.File) {
        if (!file?.filename) {
            throw new BadRequestException('Vui lòng chọn file bằng chứng');
        }

        return {
            filename: file.filename,
            imageUrl: this.uploadService.getFileUrl(file.filename),
        };
    }

    @Post()
    @ResponseMessage('Tạo khiếu nại thành công')
    async create(
        @Body() createDto: CreateComplaintDto,
        @Req() req: Request,
    ): Promise<unknown> {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.complaintService.create(createDto, currentUserId);
    }

    @Get()
    @ResponseMessage('Lấy danh sách khiếu nại của tôi thành công')
    async listMine(@Query() query: ListComplaintsDto, @Req() req: Request): Promise<unknown> {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.complaintService.listMine(currentUserId, query);
    }

    @Get(':id')
    @ResponseMessage('Lấy chi tiết khiếu nại thành công')
    async getMineById(@Param('id') id: string, @Req() req: Request): Promise<unknown> {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.complaintService.getMineById(id, currentUserId);
    }

    @Get(':id/responses')
    @ResponseMessage('Lấy phản hồi khiếu nại thành công')
    async getMineResponses(@Param('id') id: string, @Req() req: Request): Promise<unknown> {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.complaintService.listMineResponses(id, currentUserId);
    }

    @Post(':id/responses')
    @ResponseMessage('Gửi phản hồi khiếu nại thành công')
    async addMineResponse(
        @Param('id') id: string,
        @Body() payload: CreateComplaintResponseDto,
        @Req() req: Request,
    ): Promise<unknown> {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.complaintService.addMineResponse(id, currentUserId, payload);
    }

    @Get(':id/history')
    @ResponseMessage('Lấy lịch sử khiếu nại thành công')
    async getMineHistory(@Param('id') id: string, @Req() req: Request): Promise<unknown> {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.complaintService.listMineHistory(id, currentUserId);
    }
}
