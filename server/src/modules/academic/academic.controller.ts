import { Controller, Post, Body, Get, Query, BadRequestException, Param, ForbiddenException, Req, UseGuards, Put } from "@nestjs/common";
import { AcademicService } from "./academic.services";
import { CreateFacultyDto } from "./dtos/create.faculty.dto";
import { CreateClassDto } from "./dtos/create.class.dto";
import { UpdateFacultyDto } from "./dtos/update.faculty.dto";
import { UpdateClassDto } from "./dtos/update.class.dto";
import { AuthGuard } from "src/guards/auth.guard";
import { UserRole } from "src/global/globalEnum";
import type { Request } from "express";

@Controller("academic")
export class AcademicController {
    constructor(
        private readonly academicService: AcademicService
    ) { }

    private ensureAdmin(req: Request): void {
        if (req.user?.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Chỉ admin hệ thống mới có quyền thực hiện thao tác này');
        }
    }

    @UseGuards(AuthGuard)
    @Post("faculty")
    createFaculty(@Body() createFacultyDto: CreateFacultyDto, @Req() req: Request) {
        this.ensureAdmin(req);
        return this.academicService.createFaculty(createFacultyDto);
    }

    @UseGuards(AuthGuard)
    @Post("class")
    createClass(@Body() createClassDto: CreateClassDto, @Req() req: Request) {
        this.ensureAdmin(req);
        return this.academicService.createClass(createClassDto);
    }

    @UseGuards(AuthGuard)
    @Put("faculty/:id")
    updateFaculty(@Param("id") facultyId: string, @Body() updateFacultyDto: UpdateFacultyDto, @Req() req: Request) {
        this.ensureAdmin(req);
        return this.academicService.updateFaculty(facultyId, updateFacultyDto);
    }

    @UseGuards(AuthGuard)
    @Put("class/:id")
    updateClass(@Param("id") classId: string, @Body() updateClassDto: UpdateClassDto, @Req() req: Request) {
        this.ensureAdmin(req);
        return this.academicService.updateClass(classId, updateClassDto);
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
