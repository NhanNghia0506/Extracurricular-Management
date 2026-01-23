import { Injectable } from "@nestjs/common";
import { AcademicRepository } from "./academic.repository";
import { CreateFacultyDto } from "./dtos/create.faculty.dto";
import { CreateClassDto } from "./dtos/create.class.dto";
import { Types } from "mongoose";

@Injectable()
export class AcademicService {
    constructor(
        private readonly academicRepository: AcademicRepository
    ) { }

    createFaculty(facultyData: CreateFacultyDto) {
        // map từ faculty dto sang faculty entity
        const faculty = {
            name: facultyData.name,
            email: facultyData.email,
            facultyCode: facultyData.facultyCode,
            phone: facultyData.phone,
        };
        return this.academicRepository.createFaculty(faculty);
    }

    createClass(classData: CreateClassDto) {
        // map từ class dto sang class entity
        const classEntity = {
            name: classData.name,
            classCode: classData.classCode,
            facultyId: new Types.ObjectId(classData.facultyId),
        };
        return this.academicRepository.createClass(classEntity);
    }
}
