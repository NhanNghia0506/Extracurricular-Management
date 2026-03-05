import { Controller, Get, Param, UseInterceptors } from "@nestjs/common";
import { ClassSerializerInterceptor } from "@nestjs/common";
import StudentService from "./student.service";


@Controller('students')
@UseInterceptors(ClassSerializerInterceptor)
export class StudentController {
    constructor(
        private readonly studentService: StudentService,
    ) { }

    @Get(':id')
    async getStudentFullInfo(@Param('id') userId: string) {
        return this.studentService.getStudentFullInfo(userId);
    }
}