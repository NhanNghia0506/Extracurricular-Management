import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintResolution, ComplaintStatus } from 'src/global/globalEnum';

export class ReviewComplaintDto {
    @IsEnum(ComplaintStatus)
    status!: ComplaintStatus;

    @IsEnum(ComplaintResolution)
    @IsOptional()
    resolution?: ComplaintResolution;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    reviewNote!: string;
}
