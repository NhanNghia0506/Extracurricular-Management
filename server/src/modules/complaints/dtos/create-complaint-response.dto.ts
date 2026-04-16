import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateComplaintResponseDto {
    @IsString()
    @MaxLength(4000)
    message!: string;

    @IsArray()
    @IsString({ each: true })
    @IsUrl({}, { each: true })
    @IsOptional()
    attachmentUrls?: string[];
}
