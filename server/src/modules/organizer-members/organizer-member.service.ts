import { Injectable } from "@nestjs/common";
import { OrganizerMemberRepository } from "./organizer-member.repository";
import { CreateOrganizerMemberDto } from "./dtos/create.organizer-member.dto";
import { Types } from "mongoose";

@Injectable()
export class OrganizerMemberService {
    constructor(
        private readonly organizerMemberRepository: OrganizerMemberRepository
    ) { }

    create(organizerMemberData: CreateOrganizerMemberDto) {
        const organizerMember = {
            userId: new Types.ObjectId(organizerMemberData.userId),
            organizerId: new Types.ObjectId(organizerMemberData.organizerId),
            isActive: organizerMemberData.isActive,
        };

        return this.organizerMemberRepository.create(organizerMember);
    }

    getMyOrganizations(userId: string) {
        return this.organizerMemberRepository.findOrganizationsByUserId(userId);
    }

    findByUserIdAndOrganizerId(userId: string, organizerId: string) {
        return this.organizerMemberRepository.findByUserIdAndOrganizerId(userId, organizerId);
    }
}
