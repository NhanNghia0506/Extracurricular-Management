import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Teacher } from "./teacher.entity";
import { Model } from "mongoose";


@Injectable()
export class TeacherRepository {
    constructor(
        @InjectModel(Teacher.name) private readonly teacherModel: Model<Teacher>,
    ) { }

    create(teacher: Partial<Teacher>) {
        return this.teacherModel.create(teacher);
    }
}
