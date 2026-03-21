import { IsInt, IsNotEmpty, IsString, MaxLength, Max, Min } from 'class-validator';

export class CreateActivityFeedbackDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    comment: string;
}
