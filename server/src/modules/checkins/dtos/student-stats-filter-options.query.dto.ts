import { IsOptional, IsString } from 'class-validator';

export class StudentStatsFilterOptionsQueryDto {
    @IsOptional()
    @IsString()
    facultyId?: string;
}
