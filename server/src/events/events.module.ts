import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CommentGateway } from './comment.gateway';
import { NotificationGateway } from './notification.gateway';

@Module({
    providers: [ChatGateway, NotificationGateway, CommentGateway],
    exports: [ChatGateway, NotificationGateway, CommentGateway],
})
export class EventsModule { }