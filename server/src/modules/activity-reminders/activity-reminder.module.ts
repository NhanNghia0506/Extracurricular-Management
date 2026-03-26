import { Module } from '@nestjs/common';
import { ActivityModule } from '../activities/activity.module';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';
import { NotificationModule } from '../notifications/notification.module';
import { ActivityReminderService } from './activity-reminder.service';

@Module({
    imports: [ActivityModule, ActivityParticipantModule, NotificationModule],
    providers: [ActivityReminderService],
})
export class ActivityReminderModule { }