import { ConflictException, Injectable } from "@nestjs/common";
import { RegisterDto } from "./dtos/register.dto";
import { UserRepository } from "./user.repository";
import bcrypt from 'bcrypt';
import { UserRole, UserStatus } from "src/global/globalEnum";
@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async register(userData: RegisterDto) {
        if(await this.userRepository.findByEmail(userData.email)) {
            throw new ConflictException('Email đã được sử dụng');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const { name, email, avatar } = userData;
        const user = {
            name,
            email,
            avatar,
            password: hashedPassword,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
        };

        return this.userRepository.create(user);
    }
}

export default UserService; 