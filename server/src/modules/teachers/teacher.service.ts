import { Injectable } from "@nestjs/common";
import { TeacherRepository } from "./teacher.repository";
import { CreateTeacherDto } from "./dtos/create.teacher.dto";
import { Types } from "mongoose";

@Injectable()
class TeacherService {
    // Teacher service methods would go here
    constructor(
        private readonly teacherRepository: TeacherRepository
    ) {

    }

    create(teacherData: CreateTeacherDto) {
        // map từ teacher dto sang teacher entity
        const teacher = {
            userId: new Types.ObjectId(teacherData.userId),
            teacherCode: teacherData.teacherCode,
            facultyId: new Types.ObjectId(teacherData.facultyId),
        }

        console.log('teacher entity:', teacher);
        return this.teacherRepository.create(teacher);
    }
}

export default TeacherService;
