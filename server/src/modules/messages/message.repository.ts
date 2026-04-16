import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './message.entity';
import { CreateMessageDto } from './dtos/create-message.dto';
import { UpdateMessageDto } from './dtos/update-message.dto';

@Injectable()
export class MessageRepository {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>
    ) { }

    async create(
        createMessageDto: CreateMessageDto,
        senderId: string,
        senderName: string,
    ): Promise<MessageDocument> {
        return this.messageModel.create({
            ...createMessageDto,
            conversationId: new Types.ObjectId(createMessageDto.conversationId),
            senderId: new Types.ObjectId(senderId),
            senderName,
            status: 'sent',
        });
    }

    async findById(messageId: string): Promise<MessageDocument | null> {
        return this.messageModel.findById(messageId).exec();
    }

    async findByConversationId(
        conversationId: string,
        limit: number = 50,
        skip: number = 0,
    ): Promise<MessageDocument[]> {
        return this.messageModel
            .find({ conversationId: new Types.ObjectId(conversationId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
    }

    async findBySenderId(senderId: string): Promise<MessageDocument[]> {
        return this.messageModel
            .find({ senderId: new Types.ObjectId(senderId) })
            .exec();
    }

    async findLatestByConversationId(conversationId: string): Promise<MessageDocument | null> {
        return this.messageModel
            .findOne({ conversationId: new Types.ObjectId(conversationId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    async update(
        messageId: string,
        updateMessageDto: UpdateMessageDto,
    ): Promise<MessageDocument> {
        const message = await this.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        if (updateMessageDto.content && updateMessageDto.content !== message.content) {
            // Thêm vào edit history
            message.editHistory.push({
                content: message.content,
                editedAt: new Date(),
            });
            message.content = updateMessageDto.content;
        }

        if (updateMessageDto.status) {
            message.status = updateMessageDto.status;
        }

        if (updateMessageDto.reactions) {
            message.reactions = updateMessageDto.reactions;
        }

        message.updatedAt = new Date();
        return message.save();
    }

    async delete(messageId: string): Promise<MessageDocument> {
        const message = await this.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        if (message.isDeleted) {
            return message;
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'Tin nhắn đã bị thu hồi';
        message.updatedAt = new Date();

        return message.save();
    }

    async updateStatus(
        conversationId: string,
        status: string,
    ): Promise<any> {
        return this.messageModel.updateMany(
            { conversationId: new Types.ObjectId(conversationId) },
            { status, updatedAt: new Date() },
        );
    }

    async countByConversation(conversationId: string): Promise<number> {
        return this.messageModel.countDocuments({
            conversationId: new Types.ObjectId(conversationId),
        });
    }
}
