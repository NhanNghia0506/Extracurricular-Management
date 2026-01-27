import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Organizer } from "./organizer.entity";
import { Model } from "mongoose";

@Injectable()
export class OrganizerRepository {
    constructor(
        @InjectModel(Organizer.name) private readonly organizerModel: Model<Organizer>,
    ) {}

    create(organizer: Partial<Organizer>) {
        return this.organizerModel.create(organizer);
    }

    findAll() {
        return this.organizerModel.find().exec();
    }

    findById(id: string) {
        return this.organizerModel.findById(id).exec();
    }

    update(id: string, organizer: Partial<Organizer>) {
        return this.organizerModel.findByIdAndUpdate(id, organizer, { new: true }).exec();
    }

    delete(id: string) {
        return this.organizerModel.findByIdAndDelete(id).exec();
    }
}
