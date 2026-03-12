import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { NotificationGateway } from './notification.gateway';

@Module({
    providers: [ChatGateway, NotificationGateway],
    exports: [ChatGateway, NotificationGateway],
})
export class EventsModule { }