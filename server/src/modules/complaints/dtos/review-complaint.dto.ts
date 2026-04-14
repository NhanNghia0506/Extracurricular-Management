import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CheckinStatus, ComplaintResolution, ComplaintStatus } from 'src/global/globalEnum';

class CheckinAdjustmentDto {
    @IsEnum(CheckinStatus)
    @IsOptional()
    status?: CheckinStatus;

    @IsNumber()
    @IsOptional()
    trainingScoreDelta?: number;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    reason?: string;
}

export class ReviewComplaintDto {
    @IsEnum(ComplaintStatus)
    status!: ComplaintStatus;

    @IsEnum(ComplaintResolution)
    @IsOptional()
    resolution?: ComplaintResolution;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    reviewNote!: string;

    @ValidateNested()
    @Type(() => CheckinAdjustmentDto)
    @IsOptional()
    checkinAdjustment?: CheckinAdjustmentDto;
}
