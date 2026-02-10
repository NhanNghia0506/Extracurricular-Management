import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterUserDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { UserRepository } from "./user.repository";
import bcrypt from 'bcrypt';
import { UserRole, UserStatus, UserType } from "src/global/globalEnum";
import StudentService from "../students/student.service";
import TeacherService from "../teachers/teacher.service";
@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly studentService: StudentService,
        private readonly teacherService: TeacherService,
        private readonly jwtService: JwtService,
    ) { }

    async createStudent(userData: RegisterUserDto) {
        if (await this.userRepository.findByEmail(userData.email)) {
            throw new ConflictException('Email đã được sử dụng');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const { name, email, avatar, code, facultyId, classId } = userData;

        // Tạo user
        const user = await this.userRepository.create({
            name,
            email,
            avatar,
            password: hashedPassword,
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
        });

        // Tạo sinh viên
        await this.studentService.create({
            userId: user._id.toString(),
            studentCode: code,
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

    async createTeacher(userData: RegisterUserDto) {
        if (await this.userRepository.findByEmail(userData.email)) {
            throw new ConflictException('Email đã được sử dụng');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const { name, email, avatar, code, facultyId } = userData;

        // Tạo user
        const user = await this.userRepository.create({
            name,
            email,
            avatar,
            password: hashedPassword,
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
        });

        // Tạo giáo viên
        await this.teacherService.create({
            userId: user._id.toString(),
            teacherCode: code,
            facultyId,
        })

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
    }

    async login(loginData: LoginDto) {
        // Tìm user theo email
        const user = await this.userRepository.findByEmail(loginData.email);

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // So sánh mật khẩu
        const isPasswordMatch = await bcrypt.compare(loginData.password, user.password);

        if (!isPasswordMatch) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Tạo JWT token
        const payload = { sub: user._id, email: user.email, name: user.name, role: user.role };

        const access_token = this.jwtService.sign(payload);

        // Trả về thông tin user và token nếu đăng nhập thành công
        return {
            access_token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    }

    async register(userData: RegisterUserDto) {
        if (userData.userType === UserType.STUDENT) {
            return this.createStudent(userData);
        }

        return this.createTeacher(userData);
    }
}

export default UserService; 