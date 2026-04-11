import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './message.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageRepository } from './message.repository';
import { UserModule } from '../users/user.module';
import { ConversationModule } from '../conversations/conversation.module';
import { EventsModule } from '../../events/events.module';
import { UploadService } from 'src/interceptors/upload.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
        ]),
        UserModule,
        ConversationModule,
        EventsModule,
    ],
    controllers: [MessageController],
    providers: [MessageService, MessageRepository, UploadService],
    exports: [MessageService],
})
export class MessageModule { }
