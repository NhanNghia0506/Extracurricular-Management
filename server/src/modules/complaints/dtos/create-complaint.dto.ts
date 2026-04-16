import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateComplaintDto {
    @IsString()
    @IsNotEmpty()
    targetEntityId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    description!: string;

    @IsArray()
    @IsString({ each: true })
    @IsUrl({}, { each: true })
    @IsOptional()
    attachmentUrls?: string[];
}
