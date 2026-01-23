import { Module } from "@nestjs/common";
import StudentService from "./student.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Student, StudentSchema } from "./student.entity";
import { StudentController } from "./student.controller";
import { StudentRepository } from "./student.repository";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Student.name, schema: StudentSchema }
        ])
    ],
    controllers: [StudentController],
    providers: [StudentService, StudentRepository],
    exports: [StudentService],
})

export class StudentModule {}
