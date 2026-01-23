import { ConflictException, Injectable } from "@nestjs/common";
import { RegisterDto } from "./dtos/register.dto";
import { UserRepository } from "./user.repository";
import bcrypt from 'bcrypt';
import { UserRole, UserStatus } from "src/global/globalEnum";
import StudentService from "../students/student.service";
@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly studentService: StudentService,
    ) {}

    async register(userData: RegisterDto) {
        if(await this.userRepository.findByEmail(userData.email)) {
            throw new ConflictException('Email đã được sử dụng');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const { name, email, avatar, studentCode, facultyId, classId } = userData;

        // Tạo user
        const user = await this.userRepository.create({
            name,
            email,
            avatar,
            password: hashedPassword,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
        });

        // Tạo sinh viên
        await this.studentService.create({
            userId: user._id.toString(),
            studentCode,
            facultyId,
            classId,
        })

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
    }
}

export default UserService; 