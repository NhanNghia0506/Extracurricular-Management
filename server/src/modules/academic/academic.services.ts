import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AcademicRepository } from "./academic.repository";
import { CreateFacultyDto } from "./dtos/create.faculty.dto";
import { CreateClassDto } from "./dtos/create.class.dto";
import { UpdateFacultyDto } from "./dtos/update.faculty.dto";
import { UpdateClassDto } from "./dtos/update.class.dto";
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

    async createFaculty(facultyData: CreateFacultyDto) {
        const name = facultyData.name.trim();
        const email = facultyData.email.trim().toLowerCase();
        const facultyCode = facultyData.facultyCode.trim().toUpperCase();
        const phone = facultyData.phone.trim();

        if (!name || !email || !facultyCode || !phone) {
            throw new BadRequestException('Thông tin khoa không hợp lệ');
        }

        const [existingByCode, existingByEmail, existingByName] = await Promise.all([
            this.academicRepository.findFacultyByCode(facultyCode),
            this.academicRepository.findFacultyByEmail(email),
            this.academicRepository.findFacultyByName(name),
        ]);
        if (existingByCode) {
            throw new BadRequestException('Mã khoa đã tồn tại');
        }

        if (existingByEmail) {
            throw new BadRequestException('Email khoa đã tồn tại');
        }

        if (existingByName) {
            throw new BadRequestException('Tên khoa đã tồn tại');
        }

        // map từ faculty dto sang faculty entity
        const faculty = {
            name,
            email,
            facultyCode,
            phone,
        };
        return this.academicRepository.createFaculty(faculty);
    }

    async createClass(classData: CreateClassDto) {
        const name = classData.name.trim();
        const code = classData.code.trim().toUpperCase();
        const facultyId = classData.facultyId.trim();

        if (!name || !code || !facultyId) {
            throw new BadRequestException('Thông tin lớp không hợp lệ');
        }

        if (!Types.ObjectId.isValid(facultyId)) {
            throw new BadRequestException('facultyId không hợp lệ');
        }

        const faculty = await this.academicRepository.findFacultyById(facultyId);
        if (!faculty) {
            throw new NotFoundException('Không tìm thấy khoa tương ứng');
        }

        const facultyObjectId = new Types.ObjectId(facultyId);
        const [existingByCode, existingByName] = await Promise.all([
            this.academicRepository.findClassByCode(code),
            this.academicRepository.findClassByNameAndFaculty(name, facultyObjectId),
        ]);

        if (existingByCode) {
            throw new BadRequestException('Mã lớp đã tồn tại');
        }

        if (existingByName) {
            throw new BadRequestException('Tên lớp đã tồn tại trong khoa này');
        }

        // map từ class dto sang class entity
        const classEntity = {
            name,
            code,
            facultyId: facultyObjectId,
        };
        return this.academicRepository.createClass(classEntity);
    }

    async updateFaculty(facultyId: string, updateData: UpdateFacultyDto) {
        if (!Types.ObjectId.isValid(facultyId)) {
            throw new BadRequestException('facultyId không hợp lệ');
        }

        const faculty = await this.academicRepository.findFacultyById(facultyId);
        if (!faculty) {
            throw new NotFoundException('Không tìm thấy khoa cần cập nhật');
        }

        const name = (updateData.name ?? faculty.name ?? '').trim();
        const email = (updateData.email ?? faculty.email ?? '').trim().toLowerCase();
        const facultyCode = (updateData.facultyCode ?? faculty.facultyCode ?? '').trim().toUpperCase();
        const phone = (updateData.phone ?? faculty.phone ?? '').trim();

        if (!name || !email || !facultyCode || !phone) {
            throw new BadRequestException('Thông tin khoa không hợp lệ');
        }

        const [existingByCode, existingByEmail, existingByName] = await Promise.all([
            this.academicRepository.findFacultyByCode(facultyCode),
            this.academicRepository.findFacultyByEmail(email),
            this.academicRepository.findFacultyByName(name),
        ]);

        if (existingByCode && String(existingByCode._id) !== facultyId) {
            throw new BadRequestException('Mã khoa đã tồn tại');
        }

        if (existingByEmail && String(existingByEmail._id) !== facultyId) {
            throw new BadRequestException('Email khoa đã tồn tại');
        }

        if (existingByName && String(existingByName._id) !== facultyId) {
            throw new BadRequestException('Tên khoa đã tồn tại');
        }

        return this.academicRepository.updateFacultyById(facultyId, {
            name,
            email,
            facultyCode,
            phone,
        });
    }

    async updateClass(classId: string, updateData: UpdateClassDto) {
        if (!Types.ObjectId.isValid(classId)) {
            throw new BadRequestException('classId không hợp lệ');
        }

        const currentClass = await this.academicRepository.findClassEntityById(classId);
        if (!currentClass) {
            throw new NotFoundException('Không tìm thấy lớp cần cập nhật');
        }

        const nextName = (updateData.name ?? currentClass.name ?? '').trim();
        const nextCode = (updateData.code ?? currentClass.code ?? '').trim().toUpperCase();
        const nextFacultyId = (updateData.facultyId ?? String(currentClass.facultyId ?? '')).trim();

        if (!nextName || !nextCode || !nextFacultyId) {
            throw new BadRequestException('Thông tin lớp không hợp lệ');
        }

        if (!Types.ObjectId.isValid(nextFacultyId)) {
            throw new BadRequestException('facultyId không hợp lệ');
        }

        const faculty = await this.academicRepository.findFacultyById(nextFacultyId);
        if (!faculty) {
            throw new NotFoundException('Không tìm thấy khoa tương ứng');
        }

        const nextFacultyObjectId = new Types.ObjectId(nextFacultyId);
        const [existingByCode, existingByName] = await Promise.all([
            this.academicRepository.findClassByCode(nextCode),
            this.academicRepository.findClassByNameAndFaculty(nextName, nextFacultyObjectId),
        ]);

        if (existingByCode && String(existingByCode._id) !== classId) {
            throw new BadRequestException('Mã lớp đã tồn tại');
        }

        if (existingByName && String(existingByName._id) !== classId) {
            throw new BadRequestException('Tên lớp đã tồn tại trong khoa này');
        }

        return this.academicRepository.updateClassById(classId, {
            name: nextName,
            code: nextCode,
            facultyId: nextFacultyObjectId,
        });
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
