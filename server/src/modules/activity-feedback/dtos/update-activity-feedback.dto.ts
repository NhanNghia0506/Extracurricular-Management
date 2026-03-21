import { IsInt, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator';

export class UpdateActivityFeedbackDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    comment?: string;
}
