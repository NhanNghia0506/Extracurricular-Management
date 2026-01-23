import { Controller } from "@nestjs/common";
import StudentService from "./student.service";

@Controller()
export class StudentController {
    // Student controller methods would go here
    constructor(
        private readonly studentService: StudentService
    ) {

    }
}