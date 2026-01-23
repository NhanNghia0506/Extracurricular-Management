import { Controller, Post, Body } from "@nestjs/common";
import { AcademicService } from "./academic.services";
import { CreateFacultyDto } from "./dtos/create.faculty.dto";
import { CreateClassDto } from "./dtos/create.class.dto";

@Controller("academic")
export class AcademicController {
    constructor(
        private readonly academicService: AcademicService
    ) {}

    @Post("faculty")
    createFaculty(@Body() createFacultyDto: CreateFacultyDto) {
        return this.academicService.createFaculty(createFacultyDto);
    }

    @Post("class")
    createClass(@Body() createClassDto: CreateClassDto) {
        return this.academicService.createClass(createClassDto);
    }
}
