import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCheckinDto {
    @IsMongoId()
    @IsNotEmpty()
    checkinSessionId: string;

    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @IsString()
    @IsNotEmpty()
    deviceId: string;
}
