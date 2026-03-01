import { Module, forwardRef } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './activity.entity';
import { ActivityRepository } from './activity.repository';
import { UploadService } from '../../interceptors/upload.service';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';
import { OrganizerMemberModule } from '../organizer-members/organizer-member.module';
import { OptionalAuthGuard } from 'src/guards/optional-auth.guard';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Activity.name, schema: ActivitySchema },
        ]),
        UserModule,
        forwardRef(() => ActivityParticipantModule),
        OrganizerMemberModule,
    ],
    controllers: [ActivityController],
    providers: [ActivityService, ActivityRepository, UploadService, OptionalAuthGuard],
    exports: [ActivityService, ActivityRepository],
})
export class ActivityModule { }
