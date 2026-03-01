import { IsOptional, IsBoolean, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from 'src/global/globalEnum';

export class GetNotificationsQueryDto {
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 20;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    skip?: number = 0;

    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    isRead?: boolean;

    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;
}
