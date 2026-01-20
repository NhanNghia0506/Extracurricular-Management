import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./user.entity";
import { Model } from "mongoose";

@Injectable()
export class UserRepository {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ){}

    async findByEmail(email: string) {
        return this.userModel.findOne({ email });
    }

    async create(user: Partial<User>) {
        return this.userModel.create(user);
    }
}