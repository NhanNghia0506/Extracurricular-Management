import { IsEnum } from 'class-validator';
import { OrganizerMemberRole } from 'src/global/globalEnum';

export class UpdateOrganizerMemberRoleDto {
    @IsEnum(OrganizerMemberRole)
    role: OrganizerMemberRole;
}
