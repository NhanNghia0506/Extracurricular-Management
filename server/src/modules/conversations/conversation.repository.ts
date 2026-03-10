import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './conversation.entity';
import { ConversationMember, ConversationMemberDocument } from './conversation-member.entity';
import { ConversationRole } from '../../global/globalEnum';

@Injectable()
export class ConversationRepository {
    constructor(
        @InjectModel(Conversation.name)
        private conversationModel: Model<ConversationDocument>,
        @InjectModel(ConversationMember.name)
        private conversationMemberModel: Model<ConversationMemberDocument>,
    ) { }

    async create(data: Partial<Conversation>): Promise<ConversationDocument> {
        const conversation = new this.conversationModel(data);
        return conversation.save();
    }

    async findByActivityId(activityId: string): Promise<ConversationDocument | null> {
        return this.conversationModel.findOne({
            activityId: new Types.ObjectId(activityId)
        }).exec();
    }

    async findById(id: string): Promise<ConversationDocument | null> {
        return this.conversationModel
            .findById(id)
            .populate('activityId', 'title image')
            .exec();
    }

    async updateLastMessage(
        conversationId: string,
        messageData: {
            content: string;
            userId: string;
            userName: string;
        }
    ): Promise<ConversationDocument | null> {
        const normalizedContent = messageData.content?.normalize('NFC');
        const normalizedUserName = messageData.userName?.normalize('NFC');

        return this.conversationModel.findByIdAndUpdate(
            conversationId,
            {
                lastMessageContent: normalizedContent,
                lastMessageAt: new Date(),
                lastMessageUserId: new Types.ObjectId(messageData.userId),
                lastMessageUserName: normalizedUserName,
                $inc: { totalMessages: 1 }
            },
            { new: true }
        ).exec();
    }

    async addMember(
        conversationId: string,
        userId: string,
        role: ConversationRole = ConversationRole.MEMBER
    ): Promise<ConversationMemberDocument> {
        const member = new this.conversationMemberModel({
            conversationId: new Types.ObjectId(conversationId),
            userId: new Types.ObjectId(userId),
            role,
            joinedAt: new Date()
        });

        await this.conversationModel.findByIdAndUpdate(
            conversationId,
            { $inc: { participantsCount: 1 } }
        );

        return member.save();
    }

    async findMembersByConversationId(conversationId: string): Promise<ConversationMemberDocument[]> {
        return this.conversationMemberModel
            .find({ conversationId: new Types.ObjectId(conversationId) })
            .populate('userId', 'fullName email avatar')
            .exec();
    }

    async updateLastReadAt(
        conversationId: string,
        userId: string
    ): Promise<ConversationMemberDocument | null> {
        return this.conversationMemberModel.findOneAndUpdate(
            {
                conversationId: new Types.ObjectId(conversationId),
                userId: new Types.ObjectId(userId)
            },
            { lastReadAt: new Date() },
            { new: true }
        ).exec();
    }

    async getUnreadCount(conversationId: string, userId: string): Promise<number> {
        const member = await this.conversationMemberModel.findOne({
            conversationId: new Types.ObjectId(conversationId),
            userId: new Types.ObjectId(userId)
        }).exec();

        if (!member || !member.lastReadAt) {
            return 0;
        }

        // This would need to query messages table
        // Simplified version - return 0 for now
        return 0;
    }

    async findConversationsByUserId(userId: string): Promise<ConversationDocument[]> {
        const members = await this.conversationMemberModel
            .find({ userId: new Types.ObjectId(userId) })
            .exec();

        const conversationIds = members.map(m => m.conversationId);

        return this.conversationModel
            .find({ _id: { $in: conversationIds }, isActive: true })
            .populate('activityId', 'title image')
            .sort({ lastMessageAt: -1 })
            .exec();
    }

    async findRecommendedConversationsByActivityIds(
        activityIds: string[],
        userId: string,
    ): Promise<ConversationDocument[]> {
        if (activityIds.length === 0) {
            return [];
        }

        const normalizedActivityIds = activityIds.map((activityId) => new Types.ObjectId(activityId));
        const joinedMemberships = await this.conversationMemberModel
            .find({ userId: new Types.ObjectId(userId) })
            .select('conversationId')
            .exec();

        const joinedConversationIds = joinedMemberships.map((membership) => membership.conversationId);

        return this.conversationModel
            .find({
                activityId: { $in: normalizedActivityIds },
                isActive: true,
                ...(joinedConversationIds.length > 0 ? { _id: { $nin: joinedConversationIds } } : {}),
            })
            .populate('activityId', 'title image')
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .exec();
    }
}
