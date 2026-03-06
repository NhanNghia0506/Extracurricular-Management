import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './message.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageRepository } from './message.repository';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
        ]),
        UserModule,
    ],
    controllers: [MessageController],
    providers: [MessageService, MessageRepository],
    exports: [MessageService],
})
export class MessageModule { }
