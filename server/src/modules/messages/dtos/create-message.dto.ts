import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsEnum } from 'class-validator';

export class CreateMessageDto {
    @IsMongoId()
    @IsNotEmpty()
    conversationId: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsEnum(['text', 'image', 'file'])
    @IsOptional()
    messageType?: string = 'text';

    @IsString()
    @IsOptional()
    senderAvatar?: string;
}
