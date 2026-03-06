import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsEnum } from 'class-validator';

export class CreateMessageDto {
    @IsMongoId()
    @IsNotEmpty()
    conversationId: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsEnum(['text', 'image', 'file'])
    @IsOptional()
    messageType?: string = 'text';

    @IsString()
    @IsOptional()
    senderAvatar?: string;
}
