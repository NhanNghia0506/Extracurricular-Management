import { Body, Controller, Post } from "@nestjs/common";
import TeacherService from "./teacher.service";
import { CreateTeacherDto } from "./dtos/create.teacher.dto";

@Controller('teachers')
export class TeacherController {
    constructor(
        private readonly teacherService: TeacherService
    ) {

    }

    @Post()
    create(@Body() createTeacherDto: CreateTeacherDto) {
        return this.teacherService.create(createTeacherDto);
    }
}
