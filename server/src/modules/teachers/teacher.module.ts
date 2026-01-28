import { Module } from "@nestjs/common";
import TeacherService from "./teacher.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Teacher, TeacherSchema } from "./teacher.entity";
import { TeacherController } from "./teacher.controller";
import { TeacherRepository } from "./teacher.repository";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Teacher.name, schema: TeacherSchema }
        ])
    ],
    controllers: [TeacherController],
    providers: [TeacherService, TeacherRepository],
    exports: [TeacherService],
})

export class TeacherModule { }
