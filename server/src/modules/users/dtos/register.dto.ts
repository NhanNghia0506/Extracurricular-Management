import { IsNotEmpty, IsString } from "class-validator";


export class RegisterStudentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    avatar?: string;

    @IsString()
    @IsNotEmpty()
    studentCode: string;

    @IsString()
    @IsNotEmpty()
    facultyId: string;

    @IsString()
    @IsNotEmpty()
    classId: string;
}

export class RegisterTeacherDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    avatar?: string;

    @IsString()
    @IsNotEmpty()
    teacherCode: string;

    @IsString()
    @IsNotEmpty()
    facultyId: string;
}