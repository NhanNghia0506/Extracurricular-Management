import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;

    @IsMongoId()
    @IsOptional()
    parentCommentId?: string;
}
