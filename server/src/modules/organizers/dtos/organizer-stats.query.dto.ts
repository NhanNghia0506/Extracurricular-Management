import { IsOptional, IsString } from 'class-validator';

export class OrganizerStatsQueryDto {
    @IsOptional()
    @IsString()
    month?: string;

    @IsOptional()
    @IsString()
    year?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;
}
