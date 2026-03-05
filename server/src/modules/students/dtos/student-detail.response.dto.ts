import { Expose, Type } from 'class-transformer';

/**
 * DTO chứa thông tin lớp
 */
export class ClassInfoDto {
    @Expose()
    _id: string;

    @Expose()
    name: string;
}

/**
 * DTO chứa thông tin khoa
 */
export class FacultyInfoDto {
    @Expose()
    _id: string;

    @Expose()
    name: string;
}

/**
 * DTO chứa thông tin người dùng
 */
export class UserInfoDto {
    @Expose()
    _id: string;

    @Expose()
    name: string;

    @Expose()
    email: string;

    @Expose()
    avatar: string | null;

    @Expose()
    role: string;

    @Expose()
    status: number;
}

/**
 * DTO trả về thông tin đầy đủ của một sinh viên
 * Bao gồm: tên, MSSV, email, ảnh đại diện, tên lớp, tên khoa
 */
export class StudentDetailResponseDto {
    @Expose()
    _id: string;

    /**
     * Mã số sinh viên
     */
    @Expose()
    studentCode: string;

    /**
     * Tên sinh viên
     */
    @Expose()
    get name(): string {
        return this.user?.name || '';
    }

    /**
     * Email sinh viên
     */
    @Expose()
    get email(): string {
        return this.user?.email || '';
    }

    /**
     * Ảnh đại diện sinh viên
     */
    @Expose()
    get avatar(): string | null {
        return this.user?.avatar || null;
    }

    /**
     * Thông tin chi tiết người dùng
     */
    @Expose()
    @Type(() => UserInfoDto)
    user: UserInfoDto;

    /**
     * Thông tin lớp học
     */
    @Expose()
    @Type(() => ClassInfoDto)
    class: ClassInfoDto;

    /**
     * Thông tin khoa
     */
    @Expose()
    @Type(() => FacultyInfoDto)
    faculty: FacultyInfoDto;

    /**
     * Ngày tạo
     */
    @Expose()
    createdAt: Date;

    /**
     * Ngày cập nhật
     */
    @Expose()
    updatedAt: Date;
}
