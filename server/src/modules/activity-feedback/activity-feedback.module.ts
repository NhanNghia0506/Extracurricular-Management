import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from 'src/guards/auth.guard';
import { ActivityModule } from '../activities/activity.module';
import { Checkin, CheckinSchema } from '../checkins/checkin.entity';
import { OrganizerMemberModule } from '../organizer-members/organizer-member.module';
import { StudentModule } from '../students/student.module';
import { UserModule } from '../users/user.module';
import { ActivityFeedbackController } from './activity-feedback.controller';
import { ActivityFeedback, ActivityFeedbackSchema } from './activity-feedback.entity';
import { ActivityFeedbackRepository } from './activity-feedback.repository';
import { ActivityFeedbackService } from './activity-feedback.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ActivityFeedback.name, schema: ActivityFeedbackSchema },
            { name: Checkin.name, schema: CheckinSchema },
        ]),
        UserModule,
        ActivityModule,
        OrganizerMemberModule,
        StudentModule,
    ],
    controllers: [ActivityFeedbackController],
    providers: [ActivityFeedbackService, ActivityFeedbackRepository, AuthGuard],
    exports: [ActivityFeedbackService],
})
export class ActivityFeedbackModule { }
