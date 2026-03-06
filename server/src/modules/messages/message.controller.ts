import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dtos/create-message.dto';
import { UpdateMessageDto } from './dtos/update-message.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import type { Request } from 'express';

@Controller('messages')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @Post()
    @UseGuards(AuthGuard) // Thêm guard để bảo vệ endpoint nếu cần
    async createMessage(
        @Body() createMessageDto: CreateMessageDto,
        @Req() req: Request,
    ) {
        const senderId = req.user?.id;
        const senderName = req.user?.name;

        return this.messageService.createMessage(
            createMessageDto,
            senderId!,
            senderName!,
        );
    }

    @Get(':id')
    async getMessageById(@Param('id') messageId: string) {
        return this.messageService.getMessageById(messageId);
    }

    @Get('conversation/:conversationId')
    async getConversationMessages(
        @Param('conversationId') conversationId: string,
        @Query('limit') limit: number = 50,
        @Query('skip') skip: number = 0,
    ) {
        return this.messageService.getConversationMessages(
            conversationId,
            limit,
            skip,
        );
    }

    @Get('user/:senderId')
    async getUserMessages(@Param('senderId') senderId: string) {
        return this.messageService.getUserMessages(senderId);
    }

    @Put(':id')
    async updateMessage(
        @Param('id') messageId: string,
        @Body() updateMessageDto: UpdateMessageDto,
        @Req() req: Request,
    ) {
        const currentUserId = req.user?.id;
        return this.messageService.updateMessage(
            messageId,
            updateMessageDto,
            currentUserId!,
        );
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async deleteMessage(
        @Param('id') messageId: string,
        @Req() req: Request,
    ): Promise<any> {
        const currentUserId = req.user?.id;
        return this.messageService.deleteMessage(messageId, currentUserId!);
    }

    @Put(':id/mark-as-read')
    async markAsRead(@Param('id') conversationId: string): Promise<any> {
        return this.messageService.markAsRead(conversationId);
    }

    @Post(':id/reactions/:emoji')
    async addReaction(
        @Param('id') messageId: string,
        @Param('emoji') emoji: string,
    ) {
        return this.messageService.addReaction(messageId, emoji);
    }

    @Delete(':id/reactions/:emoji')
    async removeReaction(
        @Param('id') messageId: string,
        @Param('emoji') emoji: string,
    ) {
        return this.messageService.removeReaction(messageId, emoji);
    }

    @Get('conversation/:conversationId/count')
    async getConversationMessageCount(
        @Param('conversationId') conversationId: string,
    ) {
        const count = await this.messageService.getConversationMessageCount(
            conversationId,
        );
        return { count };
    }
}
