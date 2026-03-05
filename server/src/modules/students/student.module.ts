import { forwardRef, Module } from "@nestjs/common";
import StudentService from "./student.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Student, StudentSchema } from "./student.entity";
import { StudentController } from "./student.controller";
import { StudentRepository } from "./student.repository";
import { AcademicModule } from "../academic/academic.module";
import { UserModule } from "../users/user.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Student.name, schema: StudentSchema }
        ]),
        AcademicModule,
        forwardRef(() => UserModule),
    ],
    controllers: [StudentController],
    providers: [StudentService, StudentRepository],
    exports: [StudentService],
})

export class StudentModule { }
