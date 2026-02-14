import { IsDate, IsMongoId, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

export class CreateCheckinSessionDto {
    @IsMongoId()
    @IsNotEmpty()
    activityId: string;

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
}
