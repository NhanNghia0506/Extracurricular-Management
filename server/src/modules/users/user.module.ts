import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./user.entity";
import { UserController } from "./user.controller";
import UserService from "./user.service";
import { UserRepository } from "./user.repository";
import { StudentModule } from "../students/student.module";
import { JwtModule } from "@nestjs/jwt";
import { TeacherModule } from "../teachers/teacher.module";

@Module({
    imports: [
        StudentModule,
        TeacherModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ]),
        JwtModule.register({
            secret: 'your-secret-key',
            signOptions: { expiresIn: '24h' },
        }),
    ],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [],
})
export class UserModule {}