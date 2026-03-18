import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ManualCheckinDto {
    @IsMongoId()
    @IsNotEmpty()
    checkinSessionId: string;

    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}