import { Module } from '@nestjs/common';
import { ActivityParticipantService } from './activity-participant.service';
import { ActivityParticipantController } from './activity-participant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityParticipant, ActivityParticipantSchema } from './activity-participant.entity';
import { ActivityParticipantRepository } from './activity-participant.repository';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ActivityParticipant.name, schema: ActivityParticipantSchema },
        ]),
    ],
    controllers: [ActivityParticipantController],
    providers: [ActivityParticipantService, ActivityParticipantRepository],
    exports: [ActivityParticipantService],
})
export class ActivityParticipantModule { }
