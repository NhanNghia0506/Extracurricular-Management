import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ComplaintStatus } from 'src/global/globalEnum';

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

    @IsString()
    @IsOptional()
    organizerId?: string;
}
