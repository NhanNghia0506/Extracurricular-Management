import { Controller, Post, Body, Get, Query, BadRequestException } from "@nestjs/common";
import { AcademicService } from "./academic.services";
import { CreateFacultyDto } from "./dtos/create.faculty.dto";
import { CreateClassDto } from "./dtos/create.class.dto";

@Controller("academic")
export class AcademicController {
    constructor(
        private readonly academicService: AcademicService
    ) { }

    @Post("faculty")
    createFaculty(@Body() createFacultyDto: CreateFacultyDto) {
        return this.academicService.createFaculty(createFacultyDto);
    }

    @Post("class")
    createClass(@Body() createClassDto: CreateClassDto) {
        return this.academicService.createClass(createClassDto);
    }

    @Get("faculties")
    getFaculties() {
        return this.academicService.findAllFaculties();
    }

    @Get("classes")
    getClassesByFaculty(@Query("facultyId") facultyId: string) {
        if (!facultyId) {
            throw new BadRequestException('facultyId is required');
        }

        return this.academicService.findClassesByFacultyId(facultyId);
    }
}
