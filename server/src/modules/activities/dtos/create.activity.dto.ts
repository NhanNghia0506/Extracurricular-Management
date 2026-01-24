import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ActivityStatus } from '../../../global/globalEnum';

export class CreateActivityDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus;

    @IsOptional()
    @IsString()
    image?: string; // Lưu tên file (filename từ Multer)

    @IsString()
    @IsNotEmpty()
    organizerId: string;

    @IsString()
    @IsNotEmpty()
    categoryId: string;
}
