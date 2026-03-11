import { IsEnum, IsOptional } from 'class-validator';
import { ActivityApprovalStatus } from 'src/global/globalEnum';

export class ActivityApprovalQueryDto {
    @IsOptional()
    @IsEnum(ActivityApprovalStatus)
    approvalStatus?: ActivityApprovalStatus;
}
