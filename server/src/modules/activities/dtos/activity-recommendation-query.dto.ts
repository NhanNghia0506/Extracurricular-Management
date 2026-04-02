import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivityRecommendationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    limit?: number;

    @IsOptional()
    @IsIn(['hybrid'])
    strategy?: 'hybrid';
}
