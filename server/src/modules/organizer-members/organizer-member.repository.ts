import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { OrganizerMember } from "./organizer-member.entity";
import { Model } from "mongoose";

@Injectable()
export class OrganizerMemberRepository {
    constructor(
        @InjectModel(OrganizerMember.name) private readonly organizerMemberModel: Model<OrganizerMember>,
    ) { }

    create(organizerMember: Partial<OrganizerMember>) {
        return this.organizerMemberModel.create(organizerMember);
    }

    findOrganizationsByUserId(userId: string) {
        return this.organizerMemberModel.find({ userId }).populate('organizerId').exec();
    }

    findByUserIdAndOrganizerId(userId: string, organizerId: string) {
        return this.organizerMemberModel.findOne({ 
            userId, 
            organizerId 
        }).exec(); 
    }

}
