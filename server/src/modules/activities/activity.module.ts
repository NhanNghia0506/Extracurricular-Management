import { Module, forwardRef } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './activity.entity';
import { ActivityRepository } from './activity.repository';
import { UploadService } from '../../interceptors/upload.service';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';
import { JwtModule } from '@nestjs/jwt';
import { OrganizerMemberModule } from '../organizer-members/organizer-member.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Activity.name, schema: ActivitySchema },
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        forwardRef(() => ActivityParticipantModule),
        OrganizerMemberModule,
    ],
    controllers: [ActivityController],
    providers: [ActivityService, ActivityRepository, UploadService],
    exports: [ActivityService, ActivityRepository],
})
export class ActivityModule { }
