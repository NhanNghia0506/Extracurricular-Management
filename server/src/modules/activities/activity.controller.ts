import {
    Controller,
    Post,
    Body,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dtos/create.activity.dto';
import { createUploadImageInterceptor } from '../../interceptors/upload-image.interceptor';
import { UploadService } from '../../interceptors/upload.service';
import { Activity } from './activity.entity';
import { ResponseMessage } from 'src/decorators/response-message.decorator';


@Controller('activities')
export class ActivityController {
    constructor(
        private readonly activityService: ActivityService,
        private readonly uploadService: UploadService,
    ) { }

    /**
     * Tạo activity mới với upload ảnh
     * Endpoint: POST /activities
     * Form-data:
     *   - title: string (bắt buộc)
     *   - description: string (bắt buộc)
     *   - location: string (bắt buộc)
     *   - status: ActivityStatus (tùy chọn)
     *   - organizerId: string (bắt buộc)
     *   - categoryId: string (bắt buộc)
     *   - image: file (tùy chọn, max 5MB)
     */
    @ResponseMessage('Tạo hoạt động thành công')
    @Post()
    @UseInterceptors(createUploadImageInterceptor())
    async create(
        @Body() createActivityDto: CreateActivityDto,
        @UploadedFile() file: Express.Multer.File | undefined,
    ): Promise<Activity> {

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

            return await this.activityService.create(createActivityDto);
        } catch (error) {
            // Xóa file nếu tạo activity thất bại
            if (uploadedFilename) {
                this.uploadService.deleteFile(uploadedFilename);
            }
            throw error;
        }
    }
}
