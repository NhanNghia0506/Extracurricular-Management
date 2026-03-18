import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class ListCommentsDto {
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 20;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    skip?: number = 0;

    @IsEnum(['newest', 'oldest'])
    @IsOptional()
    sort?: 'newest' | 'oldest' = 'newest';
}
