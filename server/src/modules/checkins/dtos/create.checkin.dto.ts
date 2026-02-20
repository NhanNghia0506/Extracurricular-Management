import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

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
}
