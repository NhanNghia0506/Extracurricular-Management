import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { CreateMessageDto } from './dtos/create-message.dto';
import { UpdateMessageDto } from './dtos/update-message.dto';
import { MessageDocument } from './message.entity';

@Injectable()
export class MessageService {
    constructor(private readonly messageRepository: MessageRepository) { }

    async createMessage(
        createMessageDto: CreateMessageDto,
        senderId: string,
        senderName: string,
    ): Promise<MessageDocument> {
        if (!createMessageDto.content || createMessageDto.content.trim() === '') {
            throw new BadRequestException('Message content cannot be empty');
        }

        return this.messageRepository.create(
            createMessageDto,
            senderId,
            senderName,
        );
    }

    async getMessageById(messageId: string): Promise<MessageDocument> {
        const message = await this.messageRepository.findById(messageId);
        if (!message) {
            throw new NotFoundException('Message not found');
        }
        return message;
    }

    async getConversationMessages(
        conversationId: string,
        limit: number = 50,
        skip: number = 0,
    ): Promise<MessageDocument[]> {
        return this.messageRepository.findByConversationId(
            conversationId,
            limit,
            skip,
        );
    }

    async getUserMessages(senderId: string): Promise<MessageDocument[]> {
        return this.messageRepository.findBySenderId(senderId);
    }

    async updateMessage(
        messageId: string,
        updateMessageDto: UpdateMessageDto,
        currentUserId: string,
    ): Promise<MessageDocument> {
        const message = await this.getMessageById(messageId);

        // Chỉ người gửi mới có thể chỉnh sửa
        if (message.senderId.toString() !== currentUserId) {
            throw new BadRequestException(
                'You can only edit your own messages',
            );
        }

        return this.messageRepository.update(messageId, updateMessageDto);
    }

    async deleteMessage(
        messageId: string,
        currentUserId: string,
    ): Promise<any> {
        const message = await this.getMessageById(messageId);

        // Chỉ người gửi hoặc admin mới có thể xoá
        if (message.senderId.toString() !== currentUserId) {
            throw new BadRequestException(
                'You can only delete your own messages',
            );
        }

        return this.messageRepository.delete(messageId);
    }

    async markAsRead(conversationId: string): Promise<any> {
        return this.messageRepository.updateStatus(conversationId, 'read');
    }

    async addReaction(
        messageId: string,
        emoji: string,
    ): Promise<MessageDocument> {
        const message = await this.getMessageById(messageId);

        if (!message.reactions.includes(emoji)) {
            message.reactions.push(emoji);
            message.updatedAt = new Date();
            await message.save();
        }

        return message;
    }

    async removeReaction(
        messageId: string,
        emoji: string,
    ): Promise<MessageDocument> {
        const message = await this.getMessageById(messageId);

        message.reactions = message.reactions.filter(r => r !== emoji);
        message.updatedAt = new Date();
        await message.save();

        return message;
    }

    async getConversationMessageCount(conversationId: string): Promise<number> {
        return this.messageRepository.countByConversation(conversationId);
    }
}
