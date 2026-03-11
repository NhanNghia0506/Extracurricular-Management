import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ActivityApprovalStatus } from 'src/global/globalEnum';

export class UpdateActivityApprovalDto {
    @IsEnum(ActivityApprovalStatus)
    approvalStatus: ActivityApprovalStatus;

    @IsOptional()
    @IsString()
    reviewNote?: string;

    @IsOptional()
    @IsBoolean()
    isPriority?: boolean;

    @IsOptional()
    @IsBoolean()
    notifyOrganizer?: boolean;
}
