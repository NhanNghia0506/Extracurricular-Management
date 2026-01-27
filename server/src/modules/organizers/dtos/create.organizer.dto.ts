import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateOrganizerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    phone: string;
}
