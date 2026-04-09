import { IsIn, IsOptional, IsString } from 'class-validator';

export class ActivityStatsQueryDto {
    @IsOptional()
    @IsString()
    @IsIn(['month', 'quarter', 'year'])
    periodType?: 'month' | 'quarter' | 'year';

    @IsOptional()
    @IsString()
    month?: string;

    @IsOptional()
    @IsString()
    quarter?: string;

    @IsOptional()
    @IsString()
    year?: string;
}
