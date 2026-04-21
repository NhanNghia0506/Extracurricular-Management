import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional()
    @IsNotEmpty()
    fingerprintData?: {
        userAgent: string;
        screen: string;
        timezone: string;
        language: string;
        platform: string;
    };
}