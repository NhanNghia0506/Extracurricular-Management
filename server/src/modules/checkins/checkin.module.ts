import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckinController } from './checkin.controller';
import { Checkin, CheckinSchema } from './checkin.entity';
import { CheckinRepository } from './checkin.repository';
import { CheckinService } from './checkin.service';
import { CheckinSessionModule } from '../checkin-sessions/checkin-session.module';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Checkin.name, schema: CheckinSchema },
        ]),
        UserModule,
        CheckinSessionModule,
        ActivityParticipantModule
    ],
    controllers: [CheckinController],
    providers: [CheckinService, CheckinRepository],
    exports: [CheckinService],
})
export class CheckinModule { }
