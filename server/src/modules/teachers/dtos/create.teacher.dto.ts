import { IsNotEmpty, IsString } from "class-validator";

export class CreateTeacherDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    teacherCode: string;

    @IsString()
    @IsNotEmpty()
    facultyId: string;
}
