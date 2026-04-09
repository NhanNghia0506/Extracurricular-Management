import { Module, forwardRef } from '@nestjs/common';
import { ActivityParticipantService } from './activity-participant.service';
import { ActivityParticipantController } from './activity-participant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityParticipant, ActivityParticipantSchema } from './activity-participant.entity';
import { ActivityParticipantRepository } from './activity-participant.repository';
import { AuthGuard } from 'src/guards/auth.guard';
import { ActivityModule } from '../activities/activity.module';
import { UserModule } from '../users/user.module';
import { NotificationModule } from '../notifications/notification.module';
import { CheckinSession, CheckinSessionSchema } from '../checkin-sessions/checkin-session.entity';
import { Checkin, CheckinSchema } from '../checkins/checkin.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ActivityParticipant.name, schema: ActivityParticipantSchema },
            { name: CheckinSession.name, schema: CheckinSessionSchema },
            { name: Checkin.name, schema: CheckinSchema },
        ]),
        UserModule,
        NotificationModule,
        forwardRef(() => ActivityModule),
    ],
    controllers: [ActivityParticipantController],
    providers: [ActivityParticipantService, ActivityParticipantRepository, AuthGuard],
    exports: [ActivityParticipantService],
})
export class ActivityParticipantModule { }
