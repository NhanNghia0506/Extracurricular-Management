import { IsArray, IsEnum, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationPriority, NotificationType } from 'src/global/globalEnum';

export class SendActivityNotificationDto {
    @IsIn(['ALL', 'SELECTED'])
    recipientMode: 'ALL' | 'SELECTED';

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    recipientUserIds?: string[];

    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsString()
    @IsOptional()
    senderName?: string;

    @IsString()
    @IsOptional()
    senderType?: string;

    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;

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
    meta?: Record<string, unknown>;
}