import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateFacultyDto {
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    email?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    facultyCode?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    phone?: string;
}