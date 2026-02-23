import { IsOptional, IsString, IsEnum, IsDate, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityStatus } from '../../../global/globalEnum';
import type { LocationData } from 'src/global/globalInterface';

class LocationDataDto {
    @IsString()
    @IsOptional()
    address?: string;

    @IsNumber()
    @IsOptional()
    latitude?: number;

    @IsNumber()
    @IsOptional()
    longitude?: number;
}

export class UpdateActivityDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @ValidateNested()
    @Type(() => LocationDataDto)
    @IsOptional()
    location?: LocationData;

    @IsDate()
    @IsOptional()
    startAt?: Date;

    @IsDate()
    @IsOptional()
    endAt?: Date;

    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus;

    @IsNumber()
    @IsOptional()
    trainingScore?: number;

    @IsNumber()
    @IsOptional()
    participantCount?: number;

    @IsString()
    @IsOptional()
    image?: string; // Lưu tên file (filename từ Multer)
}
