import { IsNotEmpty, IsString } from "class-validator";

export class CreateFacultyDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    facultyCode: string;

    @IsString()
    @IsNotEmpty()
    phone: string;
}