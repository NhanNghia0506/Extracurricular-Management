import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { GetNotificationsQueryDto } from './dtos/get-notifications-query.dto';
import { Types } from 'mongoose';

@Injectable()
export class NotificationService {
    constructor(
        private readonly notificationRepository: NotificationRepository,
    ) { }

    async create(createNotificationDto: CreateNotificationDto) {
        const notification = await this.notificationRepository.create({
            ...createNotificationDto,
            userId: new Types.ObjectId(createNotificationDto.userId),
        });
        return notification;
    }

    async getNotifications(userId: string, query: GetNotificationsQueryDto) {
        const notifications = await this.notificationRepository.findByUserId(userId, {
            limit: query.limit,
            skip: query.skip,
            isRead: query.isRead,
            type: query.type,
        });

        const totalCount = await this.notificationRepository.countByUserId(userId);
        const unreadCount = await this.notificationRepository.countByUserId(userId, false);

        return {
            notifications,
            totalCount,
            unreadCount,
            hasMore: (query.skip || 0) + notifications.length < totalCount,
        };
    }

    async getNotificationById(id: string, userId: string) {
        const notification = await this.notificationRepository.findById(id);
        
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        // Verify ownership
        if (notification.userId.toString() !== userId) {
            throw new NotFoundException('Notification not found');
        }

        return notification;
    }

    async markAsRead(id: string, userId: string) {
        const notification = await this.getNotificationById(id, userId);
        
        if (notification.isRead) {
            return notification;
        }

        return this.notificationRepository.markAsRead(id);
    }

    async markAllAsRead(userId: string) {
        await this.notificationRepository.markAllAsRead(userId);
        return { success: true, message: 'All notifications marked as read' };
    }

    async deleteNotification(id: string, userId: string) {
        // Verify ownership before deleting
        await this.getNotificationById(id, userId);
        await this.notificationRepository.deleteById(id);
        return { success: true, message: 'Notification deleted successfully' };
    }

    async getUnreadCount(userId: string) {
        const count = await this.notificationRepository.countByUserId(userId, false);
        return { unreadCount: count };
    }

    // Helper method for creating notifications for multiple users
    async createBulkNotifications(
        userIds: string[],
        notificationData: Omit<CreateNotificationDto, 'userId'>
    ) {
        const notifications = await Promise.all(
            userIds.map(userId =>
                this.create({ ...notificationData, userId })
            )
        );
        return notifications;
    }
}
