import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { UserType } from "src/global/globalEnum";

export class RegisterUserDto {
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
    @IsOptional()
    avatar?: string;

    @IsNotEmpty()
    @IsEnum(UserType)
    userType: UserType;

    @IsString()
    @IsNotEmpty()
    code: string;

    @ValidateIf((o: RegisterUserDto) => o.userType === UserType.STUDENT)
    @IsString()
    @IsNotEmpty()
    classId: string;

    @ValidateIf((o: RegisterUserDto) =>
        o.userType === UserType.STUDENT || o.userType === UserType.TEACHER
    )
    @IsString()
    @IsNotEmpty()
    facultyId: string;
}