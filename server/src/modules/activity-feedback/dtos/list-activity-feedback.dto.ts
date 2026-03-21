import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class ListActivityFeedbackDto {
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

    @IsEnum(['newest', 'oldest'])
    @IsOptional()
    sort?: 'newest' | 'oldest' = 'newest';
}
