import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class UpdateLastMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    userName: string;
}
