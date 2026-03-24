import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OrganizerMemberRole } from 'src/global/globalEnum';

export class AddOrganizerMemberDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsEnum(OrganizerMemberRole)
    role?: OrganizerMemberRole;
}
