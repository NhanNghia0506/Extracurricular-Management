import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityModule } from '../activities/activity.module';
import { AuthGuard } from 'src/guards/auth.guard';
import { CheckinSessionController } from './checkin-session.controller';
import { CheckinSession, CheckinSessionSchema } from './checkin-session.entity';
import { CheckinSessionRepository } from './checkin-session.repository';
import { CheckinSessionService } from './checkin-session.service';
import { UserModule } from '../users/user.module';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CheckinSession.name, schema: CheckinSessionSchema },
        ]),
        UserModule,
        ActivityModule,
        ActivityParticipantModule,
        NotificationModule,
    ],
    controllers: [CheckinSessionController],
    providers: [CheckinSessionService, CheckinSessionRepository, AuthGuard],
    exports: [CheckinSessionService],
})
export class CheckinSessionModule { }
