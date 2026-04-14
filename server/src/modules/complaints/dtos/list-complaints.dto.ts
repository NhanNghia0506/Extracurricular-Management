import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from 'src/global/globalEnum';

export class ListComplaintsDto {
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @IsOptional()
    limit?: number = 10;

    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    skip?: number = 0;

    @IsEnum(ComplaintStatus)
    @IsOptional()
    status?: ComplaintStatus;

    @IsEnum(ComplaintCategory)
    @IsOptional()
    category?: ComplaintCategory;

    @IsEnum(ComplaintPriority)
    @IsOptional()
    priority?: ComplaintPriority;

    @IsString()
    @IsOptional()
    organizerId?: string;
}
