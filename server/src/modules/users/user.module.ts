import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./user.entity";
import { UserController } from "./user.controller";
import UserService from "./user.service";
import { UserRepository } from "./user.repository";
import { StudentModule } from "../students/student.module";

@Module({
    imports: [
        StudentModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ]),
    ],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [],
})
export class UserModule {}