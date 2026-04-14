import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateComplaintResponseDto {
    @IsString()
    @MaxLength(4000)
    message!: string;

    @IsBoolean()
    @IsOptional()
    isInternal?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsUrl({}, { each: true })
    @IsOptional()
    attachmentUrls?: string[];
}
