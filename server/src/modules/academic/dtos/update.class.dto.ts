import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateClassDto {
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    code?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    facultyId?: string;
}