import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from "@nestjs/common";
import { OrganizerMemberService } from "../../organizer-members/organizer-member.service";
import { Request } from "express";
import { OrganizerMemberRole } from "src/global/globalEnum";

@Injectable()
export class OrganizerManagerGuard implements CanActivate {
    constructor(
        private readonly organizerMemberService: OrganizerMemberService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const organizerId = (
            request.params.organizerId ||
            (request.query as { organizerId?: string })?.organizerId ||
            (request.body as { organizerId?: string })?.organizerId
        ) as string;
        const userId = request.user?.id;

        if (!organizerId) {
            throw new BadRequestException('organizerId is required');
        }

        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }

        const organizerMember = await this.organizerMemberService.findByUserIdAndOrganizerId(
            userId.toString(),
            organizerId
        );

        if (!organizerMember) {
            throw new ForbiddenException('You are not a member of this organization');
        }

        if (organizerMember.role !== OrganizerMemberRole.MANAGER && organizerMember.role !== OrganizerMemberRole.ADMIN) {
            throw new ForbiddenException('Only managers can perform this action');
        }

        if (!organizerMember.isActive) {
            throw new ForbiddenException('Your membership is not active');
        }

        return true;
    }
}
