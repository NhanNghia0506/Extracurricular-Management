import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Organizer } from "./organizer.entity";
import { Model, Types } from "mongoose";
import { OrganizerApprovalStatus } from "src/global/globalEnum";

export interface OrganizerUserReference {
    _id?: Types.ObjectId;
    name?: string;
    email?: string;
}

export interface OrganizerApprovalRecord extends Omit<Organizer, 'createdBy' | 'reviewedBy'> {
    _id: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy: Types.ObjectId | OrganizerUserReference;
    reviewedBy?: Types.ObjectId | OrganizerUserReference | null;
}

@Injectable()
export class OrganizerRepository {
    constructor(
        @InjectModel(Organizer.name) private readonly organizerModel: Model<Organizer>,
    ) { }

    create(organizer: Partial<Organizer>) {
        return this.organizerModel.create(organizer);
    }

    findAll() {
        return this.organizerModel.find().exec();
    }

    findById(id: string) {
        return this.organizerModel.findById(id).exec();
    }

    findAllForApproval(approvalStatus?: OrganizerApprovalStatus): Promise<OrganizerApprovalRecord[]> {
        const filter = approvalStatus ? { approvalStatus } : {};
        return this.organizerModel
            .find(filter)
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .sort({ isPriority: -1, createdAt: -1 })
            .exec() as Promise<OrganizerApprovalRecord[]>;
    }

    findApprovalById(id: string): Promise<OrganizerApprovalRecord | null> {
        return this.organizerModel
            .findById(id)
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .exec() as Promise<OrganizerApprovalRecord | null>;
    }

    countByApprovalStatus(approvalStatus: OrganizerApprovalStatus): Promise<number> {
        return this.organizerModel.countDocuments({ approvalStatus }).exec();
    }

    update(id: string, organizer: Partial<Organizer>) {
        return this.organizerModel.findByIdAndUpdate(id, organizer, { new: true }).exec();
    }

    delete(id: string) {
        return this.organizerModel.findByIdAndDelete(id).exec();
    }
}
