import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrganizerApprovalStatus } from 'src/global/globalEnum';

export class UpdateOrganizerApprovalDto {
    @IsEnum(OrganizerApprovalStatus)
    approvalStatus: OrganizerApprovalStatus;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    reviewNote?: string;

    @IsOptional()
    @IsBoolean()
    isPriority?: boolean;

    @IsOptional()
    @IsBoolean()
    notifyOrganizer?: boolean;
}