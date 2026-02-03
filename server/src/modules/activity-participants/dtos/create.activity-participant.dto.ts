import { IsNotEmpty, IsMongoId, IsEnum, IsOptional, IsDate } from 'class-validator';
import { ParticipantStatus } from '../activity-participant.entity';
import { Type } from 'class-transformer';

export class CreateActivityParticipantDto {
    @IsMongoId()
    @IsNotEmpty()
    activityId: string;

    @IsEnum(ParticipantStatus)
    @IsOptional()
    status?: ParticipantStatus;

    @IsMongoId()
    @IsOptional()
    approvedBy?: string;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    approvedAt?: Date;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    registeredAt?: Date;
}
