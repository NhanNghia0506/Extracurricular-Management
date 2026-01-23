import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Student } from "./student.entity";
import { Model } from "mongoose";


@Injectable()
export class StudentRepository {
    constructor(
        @InjectModel(Student.name) private readonly studentModel: Model<Student>,
    ) {}

    create(student: Partial<Student>) {
        return this.studentModel.create(student);
    }
}