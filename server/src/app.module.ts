import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/users/user.module';
import { StudentModule } from './modules/students/student.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ActivityModule } from './modules/activities/activity.module';
import { OrganizerModule } from './modules/organizers/organizer.module';
import { OrganizerMemberModule } from './modules/organizer-members/organizer-member.module';
import { ActivityCategoryModule } from './modules/activity-categories/activity-category.module';
import { ActivityParticipantModule } from './modules/activity-participants/activity-participant.module';
import { CheckinSessionModule } from './modules/checkin-sessions/checkin-session.module';
import { CheckinModule } from './modules/checkins/checkin.module';
import { DeviceModule } from './modules/devices/device.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { ConversationModule } from './modules/conversations/conversation.module';
import { MessageModule } from './modules/messages/message.module';
import { CommentModule } from './modules/comments/comment.module';
import { ActivityFeedbackModule } from './modules/activity-feedback/activity-feedback.module';
import { CertificateModule } from './modules/certificates/certificate.module';
import { ActivityReminderModule } from './modules/activity-reminders/activity-reminder.module';
import { EventsModule } from './events/events.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/extracurricular_management_db'),
    ScheduleModule.forRoot(),
    UserModule,
    StudentModule,
    AcademicModule,
    ActivityModule,
    OrganizerModule,
    OrganizerMemberModule,
    ActivityCategoryModule,
    ActivityParticipantModule,
    CheckinSessionModule,
    CheckinModule,
    DeviceModule,
    NotificationModule,
    ConversationModule,
    MessageModule,
    CommentModule,
    ActivityFeedbackModule,
    CertificateModule,
    ActivityReminderModule,
    EventsModule,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
