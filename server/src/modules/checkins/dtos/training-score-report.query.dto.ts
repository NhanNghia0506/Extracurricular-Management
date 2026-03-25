import { IsIn, IsOptional, IsString } from 'class-validator';

export class TrainingScoreReportQueryDto {
    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;

    @IsOptional()
    @IsString()
    facultyId?: string;

    @IsOptional()
    @IsString()
    classId?: string;

    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsString()
    @IsIn(['student', 'class', 'faculty'])
    view?: 'student' | 'class' | 'faculty';
}