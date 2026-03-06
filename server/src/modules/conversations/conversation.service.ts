import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { ConversationRepository } from './conversation.repository';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { UpdateLastMessageDto } from './dtos/update-last-message.dto';
import { Types } from 'mongoose';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { ConversationRole } from '../../global/globalEnum';

@Injectable()
export class ConversationService {
    constructor(
        private readonly conversationRepository: ConversationRepository,
        @Inject(forwardRef(() => ActivityParticipantService))
        private readonly activityParticipantService: ActivityParticipantService,
    ) { }

    async createConversation(createDto: CreateConversationDto, creatorId: string) {
        // Check if conversation already exists for this activity
        const existing = await this.conversationRepository.findByActivityId(
            createDto.activityId
        );

        if (existing) {
            throw new ConflictException('Conversation already exists for this activity');
        }

        const conversation = await this.conversationRepository.create({
            activityId: new Types.ObjectId(createDto.activityId),
            title: createDto.title,
            isActive: true,
            participantsCount: 0,
            totalMessages: 0
        });

        const conversationId = conversation._id.toString();

        // Step 1: Add creator as admin first
        try {
            await this.conversationRepository.addMember(conversationId, creatorId, ConversationRole.ADMIN);
        } catch (error) {
            console.error(`Failed to add creator ${creatorId} as admin:`, error);
        }

        // Step 2: Add all participants if requested
        if (createDto.addAllMembers) {
            try {
                const participants = await this.activityParticipantService.findByActivityId(createDto.activityId);

                const addMemberPromises = participants
                    .filter(participant => participant.userId.toString() !== creatorId) // Don't add creator twice
                    .map(participant => {
                        const userId = participant.userId.toString();
                        return this.conversationRepository.addMember(
                            conversationId,
                            userId,
                            ConversationRole.MEMBER
                        ).catch(error => {
                            console.error(`Failed to add member ${userId}:`, error);
                            return null;
                        });
                    });

                await Promise.all(addMemberPromises);
            } catch (error) {
                console.error('Error adding participants to conversation:', error);
                // Don't throw error, conversation is already created
            }
        }

        return conversation;
    }

    async getConversationByActivityId(activityId: string) {
        const conversation = await this.conversationRepository.findByActivityId(activityId);

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    async getConversationById(id: string) {
        const conversation = await this.conversationRepository.findById(id);

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    async updateLastMessage(conversationId: string, updateDto: UpdateLastMessageDto) {
        return this.conversationRepository.updateLastMessage(conversationId, {
            content: updateDto.content,
            userId: updateDto.userId,
            userName: updateDto.userName
        });
    }

    async addMember(conversationId: string, userId: string, role: ConversationRole = ConversationRole.MEMBER) {
        return this.conversationRepository.addMember(conversationId, userId, role);
    }

    async getMembers(conversationId: string) {
        return this.conversationRepository.findMembersByConversationId(conversationId);
    }

    async markAsRead(conversationId: string, userId: string) {
        return this.conversationRepository.updateLastReadAt(conversationId, userId);
    }

    async getUserConversations(userId: string) {
        return this.conversationRepository.findConversationsByUserId(userId);
    }

    async getUnreadCount(conversationId: string, userId: string): Promise<number> {
        return this.conversationRepository.getUnreadCount(conversationId, userId);
    }
}
