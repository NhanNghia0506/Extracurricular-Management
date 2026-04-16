import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CheckinStatus } from 'src/global/globalEnum';

export class UpdateCheckinStatusDto {
    @IsEnum(CheckinStatus)
    status!: CheckinStatus;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    adjustmentReason?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    failReason?: string;
}