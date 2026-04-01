import { IsOptional, IsString } from 'class-validator';

export class StudentStatsQueryDto {
    @IsOptional()
    @IsString()
    faculty?: string;

    @IsOptional()
    @IsString()
    className?: string;

    @IsOptional()
    @IsString()
    month?: string;

    @IsOptional()
    @IsString()
    year?: string;
}
