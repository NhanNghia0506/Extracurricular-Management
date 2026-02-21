import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/extracurricular_management_db'),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
