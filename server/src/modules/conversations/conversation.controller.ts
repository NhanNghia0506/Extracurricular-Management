import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    UseGuards,
    Req,
    UnauthorizedException
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { UpdateLastMessageDto } from './dtos/update-last-message.dto';
import { AddMemberDto } from './dtos/add-member.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import type { Request } from 'express';
import { ConversationRole } from 'src/global/globalEnum';

@Controller('conversations')
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) { }

    @UseGuards(AuthGuard)
    @Post()
    async create(@Body() createDto: CreateConversationDto, @Req() req: Request) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.conversationService.createConversation(createDto, userId);
    }

    @Get('activity/:activityId')
    async getByActivity(@Param('activityId') activityId: string) {
        return this.conversationService.getConversationByActivityId(activityId);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.conversationService.getConversationById(id);
    }

    @Get(':id/members')
    async getMembers(@Param('id') id: string) {
        return this.conversationService.getMembers(id);
    }

    @Post(':id/members')
    async addMember(
        @Param('id') id: string,
        @Body() addMemberDto: AddMemberDto
    ) {
        return this.conversationService.addMember(
            id,
            addMemberDto.userId,
            addMemberDto.role as ConversationRole
        );
    }

    @Patch(':id/last-message')
    @UseGuards(AuthGuard)
    async updateLastMessage(
        @Param('id') id: string,
        @Body() updateDto: UpdateLastMessageDto,
        @Req() req: Request,
    ) {
        const userId = req.user?.id;
        const userName = req.user?.name;

        if (!userId || !userName) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.conversationService.updateLastMessage(id, {
            ...updateDto,
            userId,
            userName,
        });
    }

    @Patch(':id/read')
    async markAsRead(
        @Param('id') id: string,
        @Body('userId') userId: string
    ) {
        return this.conversationService.markAsRead(id, userId);
    }

    @Get('user/:userId')
    async getUserConversations(@Param('userId') userId: string) {
        return this.conversationService.getUserConversations(userId);
    }

    @Get(':id/unread/:userId')
    async getUnreadCount(
        @Param('id') id: string,
        @Param('userId') userId: string
    ) {
        const count = await this.conversationService.getUnreadCount(id, userId);
        return { unreadCount: count };
    }
}
