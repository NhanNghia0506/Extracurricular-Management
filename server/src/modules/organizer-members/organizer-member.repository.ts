import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { OrganizerMember } from "./organizer-member.entity";
import { Model, Types } from "mongoose";
import { OrganizerMemberRole } from "src/global/globalEnum";

@Injectable()
export class OrganizerMemberRepository {
    constructor(
        @InjectModel(OrganizerMember.name) private readonly organizerMemberModel: Model<OrganizerMember>,
    ) { }

    create(organizerMember: Partial<OrganizerMember>) {
        return this.organizerMemberModel.create(organizerMember);
    }

    findOrganizationsByUserId(userId: string) {
        const objectId = new Types.ObjectId(userId);
        console.log("Fetching organizations for userId:", objectId);
        return this.organizerMemberModel
            .find({ userId: objectId, isActive: true })
            .populate('organizerId')
            .exec();
    }

    findByUserIdAndOrganizerId(userId: string, organizerId: string) {
        const userObjectId = new Types.ObjectId(userId);
        const organizerObjectId = new Types.ObjectId(organizerId);
        return this.organizerMemberModel.findOne({
            userId: userObjectId,
            organizerId: organizerObjectId
        }).exec();
    }

    findMembersByOrganizerId(organizerId: string) {
        const organizerObjectId = new Types.ObjectId(organizerId);
        return this.organizerMemberModel
            .find({ organizerId: organizerObjectId, isActive: true })
            .populate('userId', 'name email avatar')
            .sort({ createdAt: 1 })
            .exec();
    }

    findById(id: string) {
        return this.organizerMemberModel.findById(id).exec();
    }

    updateRole(id: string, role: OrganizerMemberRole) {
        return this.organizerMemberModel.findByIdAndUpdate(id, { role }, { new: true }).exec();
    }

    deleteById(id: string) {
        return this.organizerMemberModel.findByIdAndDelete(id).exec();
    }

}
