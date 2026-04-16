import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { CreateMessageDto } from './dtos/create-message.dto';
import { UpdateMessageDto } from './dtos/update-message.dto';
import { MessageDocument } from './message.entity';
import { ConversationService } from '../conversations/conversation.service';
import { ChatGateway } from '../../events/chat.gateway';

type ConversationMessage = Record<string, unknown> & {
    _id: string;
    conversationId: string;
    senderId: string;
};

@Injectable()
export class MessageService {
    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly conversationService: ConversationService,
        private readonly chatGateway: ChatGateway,
    ) { }

    private serializeMessage(message: MessageDocument): ConversationMessage {
        const serializedMessage = message.toObject() as Record<string, unknown>;

        return {
            ...serializedMessage,
            _id: message._id.toString(),
            conversationId: message.conversationId.toString(),
            senderId: message.senderId.toString(),
        };
    }

    async createMessage(
        createMessageDto: CreateMessageDto,
        senderId: string,
        senderName: string,
    ): Promise<MessageDocument> {
        const dtoRecord = createMessageDto as unknown as Record<string, unknown>;
        const rawImageUrl = dtoRecord.imageUrl;
        const normalizedContent = typeof createMessageDto.content === 'string'
            ? createMessageDto.content.trim()
            : '';
        const normalizedImageUrl: string = typeof rawImageUrl === 'string'
            ? rawImageUrl.trim()
            : '';
        const isImageMessage = createMessageDto.messageType === 'image';

        if (!isImageMessage && normalizedContent === '') {
            throw new BadRequestException('Message content cannot be empty');
        }

        if (isImageMessage && normalizedImageUrl === '') {
            throw new BadRequestException('Image message requires imageUrl');
        }

        await this.conversationService.getConversationById(createMessageDto.conversationId);

        const normalizedDto: CreateMessageDto = {
            ...createMessageDto,
            content: isImageMessage
                ? (normalizedContent || 'Đã gửi một hình ảnh')
                : normalizedContent,
            imageUrl: isImageMessage ? normalizedImageUrl : undefined,
        };

        const message = await this.messageRepository.create(
            normalizedDto,
            senderId,
            senderName,
        );

        const imageCaption = normalizedDto.messageType === 'image'
            ? (normalizedDto.content || '').trim()
            : '';
        const hasImageCaption = imageCaption !== '' && imageCaption !== 'Đã gửi một hình ảnh';

        const updatedConversation = await this.conversationService.updateLastMessage(
            normalizedDto.conversationId,
            {
                content: normalizedDto.messageType === 'image'
                    ? (hasImageCaption ? imageCaption : 'Đã gửi một hình ảnh')
                    : (normalizedDto.content || ''),
                userId: senderId,
                userName: senderName,
            },
        );

        this.chatGateway.emitConversationMessage(this.serializeMessage(message));

        const refreshedConversation = await this.conversationService.getConversationById(normalizedDto.conversationId);
        this.chatGateway.emitConversationUpdated(refreshedConversation.toObject());

        return message;
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

        if (message.senderId.toString() !== currentUserId) {
            throw new BadRequestException(
                'You can only delete your own messages',
            );
        }

        const conversationId = message.conversationId.toString();
        const latestMessageBeforeDelete = await this.messageRepository.findLatestByConversationId(conversationId);
        const revokedMessage = await this.messageRepository.delete(messageId);

        if (latestMessageBeforeDelete && latestMessageBeforeDelete._id.toString() === messageId) {
            const updatedConversation = await this.conversationService.updateAfterMessageDeletion(
                conversationId,
                {
                    content: 'Tin nhắn đã bị thu hồi',
                    userId: message.senderId.toString(),
                    userName: message.senderName,
                    lastMessageAt: message.createdAt,
                },
            );

            if (updatedConversation) {
                const refreshedConversation = await this.conversationService.getConversationById(conversationId);
                this.chatGateway.emitConversationUpdated(refreshedConversation.toObject());
            }
        }

        this.chatGateway.emitConversationMessageDeleted({
            conversationId,
            messageId,
            content: revokedMessage.content,
            isDeleted: true,
            deletedAt: revokedMessage.deletedAt,
            senderName: message.senderName,
            senderId: message.senderId.toString(),
        });

        return {
            success: true,
            message: revokedMessage,
        };
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

        message.reactions = message.reactions.filter((reaction) => reaction !== emoji);
        message.updatedAt = new Date();
        await message.save();

        return message;
    }

    async getConversationMessageCount(conversationId: string): Promise<number> {
        return this.messageRepository.countByConversation(conversationId);
    }
}
