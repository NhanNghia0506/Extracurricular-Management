import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterUserDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { UserRepository } from "./user.repository";
import bcrypt from 'bcrypt';
import { UserRole, UserStatus, UserType } from "src/global/globalEnum";
import StudentService from "../students/student.service";
import TeacherService from "../teachers/teacher.service";
import { DeviceService } from "../devices/device.service";
import { createFingerPrintHash } from "src/utils/createFingerPrintHash";
import { UpdateProfileDto } from "./dtos/update-profile.dto";
@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly studentService: StudentService,
        private readonly teacherService: TeacherService,
        private readonly jwtService: JwtService,
        private readonly deviceService: DeviceService,
    ) { }

    async createStudent(userData: RegisterUserDto) {
        if (await this.userRepository.findByEmail(userData.email)) {
            throw new ConflictException('Email đã được sử dụng');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const { name, email, avatar, code, classId } = userData;

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
            // facultyId,
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

        // hash fingerprint data để tạo deviceId
        const fingerprintHash = createFingerPrintHash(loginData.fingerprintData)

        const device = await this.deviceService.findOrCreateDevice(fingerprintHash, user._id.toString())

        // Trả về thông tin user và token nếu đăng nhập thành công
        return {
            access_token,
            deviceId: device.id,
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

    async getProfile(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar || null,
            phone: user.phone || '',
        };
    }

    async updateProfile(userId: string, payload: UpdateProfileDto) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        const updatePayload: Record<string, string> = {};
        if (typeof payload.name === 'string') {
            updatePayload.name = payload.name.trim();
        }

        if (typeof payload.avatar === 'string') {
            updatePayload.avatar = payload.avatar.trim();
        }

        if (typeof payload.phone === 'string') {
            updatePayload.phone = payload.phone.trim();
        }

        const updatedUser = await this.userRepository.updateById(userId, updatePayload);
        if (!updatedUser) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar || null,
            phone: updatedUser.phone || '',
        };
    }

    async updateAvatar(userId: string, avatarPath: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        const updatedUser = await this.userRepository.updateById(userId, {
            avatar: avatarPath,
        });

        if (!updatedUser) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar || null,
            phone: updatedUser.phone || '',
        };
    }

    async findBasicByEmail(email: string) {
        const normalizedEmail = email.trim().toLowerCase();
        return this.userRepository.findBasicByEmail(normalizedEmail);
    }
}

export default UserService; 