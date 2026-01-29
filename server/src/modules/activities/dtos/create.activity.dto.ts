import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDate, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityStatus } from '../../../global/globalEnum';
import type { LocationData } from 'src/global/globalInterface';

class LocationDataDto {
    @IsString()
    @IsNotEmpty()
    address: string;

    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;
}

export class CreateActivityDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @ValidateNested()
    @Type(() => LocationDataDto)
    @IsNotEmpty()
    location: LocationData;

    @IsNotEmpty()
    @IsDate()
    startAt: Date;

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
