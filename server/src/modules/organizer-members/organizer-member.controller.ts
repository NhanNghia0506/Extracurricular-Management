import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { OrganizerMemberService } from "./organizer-member.service";
import { CreateOrganizerMemberDto } from "./dtos/create.organizer-member.dto";

@Controller("organizer-members")
export class OrganizerMemberController {
    constructor(
        private readonly organizerMemberService: OrganizerMemberService
    ) {}

    @Post()
    create(@Body() createOrganizerMemberDto: CreateOrganizerMemberDto) {
        return this.organizerMemberService.create(createOrganizerMemberDto);
    }

    @Get("my-organizations/:userId")
    getMyOrganizations(@Param("userId") userId: string) {
        // console.log("Fetching organizations for userId:", userId);
        return this.organizerMemberService.getMyOrganizations(userId);
    }

}
