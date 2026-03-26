import { IsNotEmpty, IsMongoId, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityParticipantDto {
    @IsMongoId()
    @IsNotEmpty()
    activityId: string;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    registeredAt?: Date;
}
