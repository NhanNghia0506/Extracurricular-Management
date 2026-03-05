import { Controller, Post, Body, Get, Query, BadRequestException, Param } from "@nestjs/common";
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

    /**
     * Lấy thông tin chi tiết của một khoa theo ID
     * @param facultyId - ID của khoa
     */
    @Get("faculty/:id")
    getFacultyById(@Param("id") facultyId: string) {
        return this.academicService.getFacultyById(facultyId);
    }

    /**
     * Lấy thông tin chi tiết của một lớp theo ID
     * @param classId - ID của lớp
     */
    @Get("class/:id")
    getClassById(@Param("id") classId: string) {
        return this.academicService.getClassById(classId);
    }
}
