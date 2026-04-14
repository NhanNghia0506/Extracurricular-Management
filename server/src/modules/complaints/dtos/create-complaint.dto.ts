import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ComplaintCategory, ComplaintPriority } from 'src/global/globalEnum';

export class CreateComplaintDto {
    @IsEnum(ComplaintCategory)
    category!: ComplaintCategory;

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

    @IsEnum(ComplaintPriority)
    @IsOptional()
    priority?: ComplaintPriority;

    @IsArray()
    @IsString({ each: true })
    @IsUrl({}, { each: true })
    @IsOptional()
    attachmentUrls?: string[];
}
