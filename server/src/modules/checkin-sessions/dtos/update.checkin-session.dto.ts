import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
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

export class UpdateCheckinSessionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title: string;

    @ValidateNested()
    @Type(() => LocationDataDto)
    @IsNotEmpty()
    location: LocationData;

    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    startTime: Date;

    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    endTime: Date;

    @IsNumber()
    @IsNotEmpty()
    radiusMetters: number;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    lateAfter?: Date;
}