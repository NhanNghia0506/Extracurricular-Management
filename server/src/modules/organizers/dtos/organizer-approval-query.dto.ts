import { IsEnum, IsOptional } from 'class-validator';
import { OrganizerApprovalStatus } from 'src/global/globalEnum';

export class OrganizerApprovalQueryDto {
    @IsOptional()
    @IsEnum(OrganizerApprovalStatus)
    approvalStatus?: OrganizerApprovalStatus;
}