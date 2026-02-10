import { Injectable } from "@nestjs/common";
import { StudentRepository } from "./student.repository";
import { CreateStudentDto } from "./dtos/create.student.dto";
import { Types } from "mongoose";

@Injectable()
class StudentService {
    // Student service methods would go here
    constructor(
    private readonly studentRepository: StudentRepository
    ) {

    }

    create(studentData: CreateStudentDto) {
        // map từ student dto sang student entity
        const student = {
            userId: new Types.ObjectId(studentData.userId),
            studentCode: studentData.studentCode,
            classId: new Types.ObjectId(studentData.classId),
            facultyId: new Types.ObjectId(studentData.facultyId),
        }

        return this.studentRepository.create(student);
    }
}

export default StudentService;