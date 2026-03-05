import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { StudentRepository } from "./student.repository";
import { CreateStudentDto } from "./dtos/create.student.dto";
import { Types } from "mongoose";
import UserService from "../users/user.service";
import { AcademicService } from "../academic/academic.services";
import { StudentProfile } from "src/global/globalInterface";

@Injectable()
class StudentService {
    constructor(
        private readonly studentRepository: StudentRepository,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly academicService: AcademicService,
    ) { }

    create(studentData: CreateStudentDto) {
        // map từ student dto sang student entity
        // facultyId không cần lưu vì có thể lấy từ classId -> facultyId
        const student = {
            userId: new Types.ObjectId(studentData.userId),
            studentCode: studentData.studentCode,
            classId: new Types.ObjectId(studentData.classId),
        }

        return this.studentRepository.create(student);
    }

    async getStudentById(studentId: string) {
        const student = await this.studentRepository.findById(studentId);

        if (!student) {
            throw new Error(`Sinh viên với ID ${studentId} không tồn tại`);
        }

        return student;
    }

    async getStudentByUserId(userId: string) {
        const student = await this.studentRepository.findByUserId(userId);

        if (!student) {
            throw new Error(`Sinh viên với userId ${userId} không tồn tại`);
        }

        return student;
    }

    async getStudentFullInfo(userId: string): Promise<StudentProfile> {
        const student = await this.getStudentByUserId(userId);
        const user = await this.userService.getProfile(student.userId.toString());
        const academicData = await this.academicService.getClassById(student.classId.toString());

        return {
            id: student._id.toString(),
            mssv: student.studentCode,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            class: academicData.className,
            faculty: academicData.facultyName,
        } as StudentProfile;
    }
}

export default StudentService;