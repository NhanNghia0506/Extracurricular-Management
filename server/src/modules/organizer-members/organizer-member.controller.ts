import { Controller, Post, Body, Get, Param, Patch, Delete, Req, UseGuards, UnauthorizedException } from "@nestjs/common";
import { OrganizerMemberService } from "./organizer-member.service";
import { CreateOrganizerMemberDto } from "./dtos/create.organizer-member.dto";
import { AuthGuard } from "src/guards/auth.guard";
import type { Request } from "express";
import { AddOrganizerMemberDto } from "./dtos/add-organizer-member.dto";
import { UpdateOrganizerMemberRoleDto } from "./dtos/update-organizer-member-role.dto";

@Controller("organizer-members")
export class OrganizerMemberController {
    constructor(
        private readonly organizerMemberService: OrganizerMemberService
    ) { }

    @Post()
    create(@Body() createOrganizerMemberDto: CreateOrganizerMemberDto) {
        return this.organizerMemberService.create(createOrganizerMemberDto);
    }

    @UseGuards(AuthGuard)
    @Get("my-organizations/:userId")
    getMyOrganizations(@Param("userId") userId: string) {
        // console.log("Fetching organizations for userId:", userId);
        return this.organizerMemberService.getMyOrganizations(userId);
    }

    @UseGuards(AuthGuard)
    @Get('organizer/:organizerId/members')
    async getMembersByOrganizer(
        @Param('organizerId') organizerId: string,
        @Req() req: Request,
    ) {
        const actorUserId = req.user?.id;
        if (!actorUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.organizerMemberService.getMembersByOrganizer(organizerId, actorUserId, req.user?.role);
    }

    @UseGuards(AuthGuard)
    @Post('organizer/:organizerId/members')
    async addMemberByEmail(
        @Param('organizerId') organizerId: string,
        @Body() payload: AddOrganizerMemberDto,
        @Req() req: Request,
    ) {
        const actorUserId = req.user?.id;
        if (!actorUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.organizerMemberService.addMemberByEmail(organizerId, payload, actorUserId, req.user?.role);
    }

    @UseGuards(AuthGuard)
    @Patch(':memberId/role')
    async updateMemberRole(
        @Param('memberId') memberId: string,
        @Body() payload: UpdateOrganizerMemberRoleDto,
        @Req() req: Request,
    ) {
        const actorUserId = req.user?.id;
        if (!actorUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.organizerMemberService.updateMemberRole(memberId, payload.role, actorUserId, req.user?.role);
    }

    @UseGuards(AuthGuard)
    @Delete(':memberId')
    async deleteMember(
        @Param('memberId') memberId: string,
        @Req() req: Request,
    ) {
        const actorUserId = req.user?.id;
        if (!actorUserId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.organizerMemberService.deleteMember(memberId, actorUserId, req.user?.role);
    }

}
