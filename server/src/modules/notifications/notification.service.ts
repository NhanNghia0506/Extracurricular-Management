import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { GetNotificationsQueryDto } from './dtos/get-notifications-query.dto';
import { Types } from 'mongoose';
import { NotificationGateway } from '../../events/notification.gateway';
import { NotificationDocument } from './notification.entity';

@Injectable()
export class NotificationService {
    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    private serializeNotification(notification: NotificationDocument | null) {
        if (!notification) {
            return null;
        }

        const serialized = notification.toObject() as Record<string, unknown> & {
            _id?: { toString(): string } | string;
            userId?: { toString(): string } | string;
            readAt?: Date | string;
            createdAt?: Date | string;
            updatedAt?: Date | string;
        };

        return {
            ...serialized,
            _id: serialized._id ? String(serialized._id) : undefined,
            userId: serialized.userId ? String(serialized.userId) : undefined,
            readAt: serialized.readAt ? new Date(serialized.readAt).toISOString() : undefined,
            createdAt: serialized.createdAt ? new Date(serialized.createdAt).toISOString() : undefined,
            updatedAt: serialized.updatedAt ? new Date(serialized.updatedAt).toISOString() : undefined,
        };
    }

    async create(createNotificationDto: CreateNotificationDto) {
        const notification = await this.notificationRepository.create({
            ...createNotificationDto,
            userId: new Types.ObjectId(createNotificationDto.userId),
        });

        const unreadCount = await this.notificationRepository.countByUserId(createNotificationDto.userId, false);
        const serializedNotification = this.serializeNotification(notification as NotificationDocument);
        if (serializedNotification) {
            this.notificationGateway.emitNotificationCreated(
                createNotificationDto.userId,
                serializedNotification,
                unreadCount,
            );
        }

        return notification;
    }

    async createIfNotExistsByGroupKey(createNotificationDto: CreateNotificationDto) {
        const groupKey = createNotificationDto.groupKey?.trim();

        if (!groupKey) {
            const notification = await this.create(createNotificationDto);
            return {
                notification,
                created: true,
            };
        }

        const existingNotification = await this.notificationRepository.findByUserIdAndGroupKey(
            createNotificationDto.userId,
            groupKey,
        );

        if (existingNotification) {
            return {
                notification: existingNotification,
                created: false,
            };
        }

        const notification = await this.create({
            ...createNotificationDto,
            groupKey,
        });

        return {
            notification,
            created: true,
        };
    }

    async getNotifications(userId: string, query: GetNotificationsQueryDto) {
        const notifications = await this.notificationRepository.findByUserId(userId, {
            limit: query.limit,
            skip: query.skip,
            isRead: query.isRead,
            type: query.type,
            senderType: query.senderType,
        });

        const totalCount = await this.notificationRepository.countByUserId(userId, undefined, query.senderType);
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

        const updatedNotification = await this.notificationRepository.markAsRead(id);
        const unreadCount = await this.notificationRepository.countByUserId(userId, false);
        this.notificationGateway.emitNotificationRead(userId, id, unreadCount);

        return updatedNotification;
    }

    async markAllAsRead(userId: string) {
        await this.notificationRepository.markAllAsRead(userId);
        this.notificationGateway.emitAllNotificationsRead(userId);
        return { success: true, message: 'All notifications marked as read' };
    }

    async deleteNotification(id: string, userId: string) {
        // Verify ownership before deleting
        const notification = await this.getNotificationById(id, userId);
        await this.notificationRepository.deleteById(id);
        const unreadCount = await this.notificationRepository.countByUserId(userId, false);
        this.notificationGateway.emitNotificationDeleted(userId, id, unreadCount, notification.type, notification.senderType);
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
