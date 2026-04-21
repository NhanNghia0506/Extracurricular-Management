import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from 'src/guards/auth.guard';
import {
    ActivityParticipant,
    ActivityParticipantSchema,
} from '../activity-participants/activity-participant.entity';
import { ActivityModule } from '../activities/activity.module';
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
            { name: ActivityParticipant.name, schema: ActivityParticipantSchema },
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
