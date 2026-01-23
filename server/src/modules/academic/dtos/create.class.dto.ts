import { IsNotEmpty, IsString } from "class-validator";

export class CreateClassDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    classCode: string;

    @IsString()
    @IsNotEmpty()
    facultyId: string;
}
