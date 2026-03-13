import { IsNotEmpty, IsBoolean, IsMongoId, IsEnum, IsOptional } from 'class-validator';
import { OrganizerMemberRole } from 'src/global/globalEnum';

export class CreateOrganizerMemberDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @IsMongoId()
    @IsNotEmpty()
    organizerId: string;

    @IsBoolean()
    @IsNotEmpty()
    isActive: boolean;

    @IsOptional()
    @IsEnum(OrganizerMemberRole)
    role?: OrganizerMemberRole;
}
