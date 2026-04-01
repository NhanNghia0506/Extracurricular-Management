import { Injectable } from "@nestjs/common";
import { AcademicRepository } from "./academic.repository";
import { CreateFacultyDto } from "./dtos/create.faculty.dto";
import { CreateClassDto } from "./dtos/create.class.dto";
import { Types } from "mongoose";

export type Academic = {
    className: string;
    facultyName: string | null;
};

@Injectable()
export class AcademicService {
    constructor(
        private readonly academicRepository: AcademicRepository
    ) { }

    createFaculty(facultyData: CreateFacultyDto) {
        // map từ faculty dto sang faculty entity
        const faculty = {
            name: facultyData.name,
            email: facultyData.email,
            facultyCode: facultyData.facultyCode,
            phone: facultyData.phone,
        };
        return this.academicRepository.createFaculty(faculty);
    }

    createClass(classData: CreateClassDto) {
        // map từ class dto sang class entity
        const classEntity = {
            name: classData.name,
            code: classData.code,
            facultyId: new Types.ObjectId(classData.facultyId),
        };
        return this.academicRepository.createClass(classEntity);
    }

    findAllFaculties() {
        return this.academicRepository.findAllFaculties();
    }

    findClassesByFacultyId(facultyId: string) {
        return this.academicRepository.findClassesByFacultyId(facultyId);
    }

    findAllClasses() {
        return this.academicRepository.findAllClasses();
    }

    /**
     * Lấy thông tin chi tiết của một khoa (Faculty) theo ID
     * @param facultyId - ID của khoa
     * @returns Thông tin khoa bao gồm: name, email, facultyCode, phone
     */
    async getFacultyById(facultyId: string) {
        const faculty = await this.academicRepository.findFacultyById(facultyId);

        if (!faculty) {
            throw new Error(`Khoa với ID ${facultyId} không tồn tại`);
        }

        return faculty;
    }

    /**
     * Lấy thông tin học thuật theo classId
     * @param classId - ID của lớp
     * @returns Academic gồm className và facultyName
     */
    async getClassById(classId: string): Promise<Academic> {
        const classData = await this.academicRepository.findClassById(classId);

        if (!classData) {
            throw new Error(`Lớp với ID ${classId} không tồn tại`);
        }

        const facultyData = classData.facultyId as { name?: string } | undefined;

        return {
            className: classData.name,
            facultyName: facultyData?.name ?? null,
        };
    }
}
