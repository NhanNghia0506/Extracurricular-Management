import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { OrganizerMemberRole, UserRole } from "src/global/globalEnum";
import { OrganizerMemberService } from "src/modules/organizer-members/organizer-member.service";

@Injectable()
export class OrganizerManagerGuard implements CanActivate {
    constructor(
        private readonly organizerMemberService: OrganizerMemberService
    ) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user;

        if (!user || !user.id) {
            throw new UnauthorizedException('User not authenticated');
        }

        const organizerId = (
            request.params.organizerId ||
            (request.query as { organizerId?: string })?.organizerId ||
            (request.body as { organizerId?: string })?.organizerId
        ) as string;
        if (!organizerId) {
            throw new BadRequestException('organizerId is required');
        }

        if (user.role === UserRole.ADMIN) {
            return true;
        }

        // Kiểm tra role của user trong organizer
        const member = await this.organizerMemberService.findByUserIdAndOrganizerId(user.id, organizerId);
        if (!member) {
            throw new ForbiddenException('You are not a member of this organization');
        }

        if (![OrganizerMemberRole.MANAGER, OrganizerMemberRole.ADMIN].includes(member.role)) {
            throw new ForbiddenException('Only managers can perform this action');
        }
        return true;
    }
}