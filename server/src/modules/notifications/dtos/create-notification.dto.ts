import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { NotificationType, NotificationPriority } from 'src/global/globalEnum';

export class CreateNotificationDto {
    @IsString()
    userId: string;

    @IsString()
    senderName: string;

    @IsString()
    @IsOptional()
    senderType?: string;

    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsEnum(NotificationPriority)
    @IsOptional()
    priority?: NotificationPriority;

    @IsString()
    @IsOptional()
    linkUrl?: string;

    @IsString()
    @IsOptional()
    groupKey?: string;

    @IsObject()
    @IsOptional()
    meta?: Record<string, any>;
}
