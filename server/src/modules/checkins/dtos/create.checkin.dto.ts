import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckinDto {
    @IsMongoId()
    @IsNotEmpty()
    checkinSessionId!: string;

    @IsMongoId()
    @IsNotEmpty()
    userId!: string;

    @IsNumber()
    @IsNotEmpty()
    latitude!: number;

    @IsNumber()
    @IsNotEmpty()
    longitude!: number;

    @IsString()
    @IsOptional()
    deviceId?: string;

    @IsOptional()
    @IsNotEmpty()
    fingerprintData?: {
        userAgent: string;
        screen: string;
        timezone: string;
        language: string;
        platform: string;
    };
}
