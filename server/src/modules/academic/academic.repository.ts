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

    findFacultyByCode(facultyCode: string) {
        return this.facultyModel.findOne({ facultyCode }).lean();
    }

    findFacultyByEmail(email: string) {
        return this.facultyModel.findOne({ email }).lean();
    }

    findFacultyByName(name: string) {
        return this.facultyModel.findOne({ name }).lean();
    }

    createClass(classData: Partial<Class>) {
        return this.classModel.create(classData);
    }

    findClassByCode(code: string) {
        return this.classModel.findOne({ code }).lean();
    }

    findClassByNameAndFaculty(name: string, facultyId: Types.ObjectId) {
        return this.classModel.findOne({ name, facultyId }).lean();
    }

    findAllFaculties() {
        return this.facultyModel.find().lean();
    }

    findClassesByFacultyId(facultyId: string) {
        const id = new Types.ObjectId(facultyId);
        return this.classModel.find({ facultyId: id }).lean();
    }

    findAllClasses() {
        return this.classModel.find().lean();
    }

    findFacultyById(facultyId: string) {
        const id = new Types.ObjectId(facultyId);
        return this.facultyModel.findById(id).lean();
    }

    updateFacultyById(facultyId: string, updateData: Partial<Faculty>) {
        const id = new Types.ObjectId(facultyId);
        return this.facultyModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }

    findClassEntityById(classId: string) {
        const id = new Types.ObjectId(classId);
        return this.classModel.findById(id).lean();
    }

    findClassById(classId: string) {
        const id = new Types.ObjectId(classId);
        return this.classModel.findById(id).populate({
            path: 'facultyId',
            select: 'name',
        }).lean();
    }

    updateClassById(classId: string, updateData: Partial<Class>) {
        const id = new Types.ObjectId(classId);
        return this.classModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }
}
