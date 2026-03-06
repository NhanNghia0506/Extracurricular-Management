import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class UpdateMessageDto {
    @IsString()
    @IsOptional()
    content?: string;

    @IsEnum(['sending', 'sent', 'delivered', 'read'])
    @IsOptional()
    status?: string;

    @IsArray()
    @IsOptional()
    reactions?: string[];
}
