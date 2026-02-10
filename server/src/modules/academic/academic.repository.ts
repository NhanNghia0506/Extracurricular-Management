import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Faculty } from "./entities/faculty.entity";
import { Class } from "./entities/class.entity";
import { Model, Types } from "mongoose";

@Injectable()
export class AcademicRepository {
    constructor(
        @InjectModel(Faculty.name) private readonly facultyModel: Model<Faculty>,
        @InjectModel(Class.name) private readonly classModel: Model<Class>,
    ) { }

    createFaculty(faculty: Partial<Faculty>) {
        return this.facultyModel.create(faculty);
    }

    createClass(classData: Partial<Class>) {
        return this.classModel.create(classData);
    }

    findAllFaculties() {
        return this.facultyModel.find().lean();
    }

    findClassesByFacultyId(facultyId: string) {
        const id = new Types.ObjectId(facultyId);
        return this.classModel.find({ facultyId: id }).lean();
    }
}
