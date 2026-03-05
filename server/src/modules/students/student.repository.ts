import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Student } from "./student.entity";
import { Model, Types } from "mongoose";


@Injectable()
export class StudentRepository {
    constructor(
        @InjectModel(Student.name) private readonly studentModel: Model<Student>,
    ) { }

    create(student: Partial<Student>) {
        return this.studentModel.create(student);
    }

    findById(studentId: string) {
        return this.studentModel.findById(studentId).lean().exec();
    }

    findByUserId(userId: string) {
        return this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
    }

    /**
     * Lấy thông tin sinh viên đầy đủ bao gồm thông tin user
     * @param studentId - ID của sinh viên
     * @returns Thông tin sinh viên với chi tiết user (tên, ảnh)
     */
    findByIdWithUserDetails(studentId: string) {
        return this.studentModel.findById(studentId).populate({
            path: 'userId',
            select: 'name email avatar status role',
            model: 'User'
        }).populate({
            path: 'classId',
            select: 'name code',
            model: 'Class',
            populate: {
                path: 'facultyId',
                select: 'name',
                model: 'Faculty'
            }
        }).lean().exec();
    }

    /**
     * Lấy thông tin sinh viên bằng userId
     * @param userId - ID của user
     * @returns Thông tin sinh viên với chi tiết user
     */
    findByUserIdWithDetails(userId: string) {
        return this.studentModel.findOne({ userId }).populate({
            path: 'userId',
            select: 'name email avatar status role',
            model: 'User'
        }).populate({
            path: 'classId',
            select: 'name code',
            model: 'Class',
            populate: {
                path: 'facultyId',
                select: 'name',
                model: 'Faculty'
            }
        }).lean().exec();
    }
}