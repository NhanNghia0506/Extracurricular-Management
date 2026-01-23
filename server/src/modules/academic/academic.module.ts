import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Class, ClassSchema } from "./entities/class.entity";
import { Faculty, FacultySchema } from "./entities/faculty.entity";
import { AcademicController } from "./academic.controller";
import { AcademicRepository } from "./academic.repository";
import { AcademicService } from "./academic.services";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Class.name, schema: ClassSchema },
            { name: Faculty.name, schema: FacultySchema }
        ])
    ],
    controllers: [AcademicController],
    providers: [AcademicService, AcademicRepository],
    exports: [],
})

export class AcademicModule { }