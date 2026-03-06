import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './conversation.entity';
import { ConversationMember, ConversationMemberSchema } from './conversation-member.entity';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationRepository } from './conversation.repository';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Conversation.name, schema: ConversationSchema },
            { name: ConversationMember.name, schema: ConversationMemberSchema },
        ]),
        forwardRef(() => ActivityParticipantModule),
        UserModule,
    ],
    controllers: [ConversationController],
    providers: [ConversationService, ConversationRepository],
    exports: [ConversationService, ConversationRepository],
})
export class ConversationModule { }
