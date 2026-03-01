import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Notification } from "./notification.entity";
import { NotificationType } from "src/global/globalEnum";

@Injectable()
export class NotificationRepository {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    ) { }

    async create(notification: Partial<Notification>) {
        return this.notificationModel.create(notification);
    }

    async findById(id: string) {
        return this.notificationModel.findById(id);
    }

    async findByUserId(
        userId: string,
        options?: {
            limit?: number;
            skip?: number;
            isRead?: boolean;
            type?: NotificationType;
        }
    ) {
        const query: Record<string, any> = { userId: new Types.ObjectId(userId) };
        
        if (options?.isRead !== undefined) {
            query.isRead = options.isRead;
        }
        
        if (options?.type) {
            query.type = options.type;
        }

        return this.notificationModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(options?.limit || 20)
            .skip(options?.skip || 0)
            .exec();
    }

    async countByUserId(userId: string, isRead?: boolean) {
        const query: Record<string, any> = { userId: new Types.ObjectId(userId) };
        if (isRead !== undefined) {
            query.isRead = isRead;
        }
        return this.notificationModel.countDocuments(query);
    }

    async markAsRead(id: string) {
        return this.notificationModel.findByIdAndUpdate(
            id,
            { isRead: true, readAt: new Date() },
            { new: true }
        );
    }

    async markAllAsRead(userId: string) {
        return this.notificationModel.updateMany(
            { userId: new Types.ObjectId(userId), isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    async deleteById(id: string) {
        return this.notificationModel.findByIdAndDelete(id);
    }

    async deleteByUserId(userId: string) {
        return this.notificationModel.deleteMany({ userId: new Types.ObjectId(userId) });
    }
}
