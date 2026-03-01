import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./user.entity";
import { UserController } from "./user.controller";
import UserService from "./user.service";
import { UserRepository } from "./user.repository";
import { StudentModule } from "../students/student.module";
import { JwtModule } from "@nestjs/jwt";
import { TeacherModule } from "../teachers/teacher.module";
import { DeviceModule } from "../devices/device.module";

@Module({
    imports: [
        StudentModule,
        TeacherModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        DeviceModule,
    ],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [JwtModule],
})
export class UserModule {}