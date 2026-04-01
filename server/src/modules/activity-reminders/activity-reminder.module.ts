import { Module } from '@nestjs/common';
import { ActivityModule } from '../activities/activity.module';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';
import { NotificationModule } from '../notifications/notification.module';
import { ActivityReminderService } from './activity-reminder.service';
import { MailModule } from '../mail/mail.module';
import { OrganizerModule } from '../organizers/organizer.module';
import { UserModule } from '../users/user.module';

@Module({
    imports: [ActivityModule, ActivityParticipantModule, NotificationModule, MailModule, OrganizerModule, UserModule],
    providers: [ActivityReminderService],
})
export class ActivityReminderModule { }