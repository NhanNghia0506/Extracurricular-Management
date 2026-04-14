import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminGuard } from 'src/guards/admin.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { UploadService } from 'src/interceptors/upload.service';
import { ActivityModule } from '../activities/activity.module';
import { CheckinModule } from '../checkins/checkin.module';
import { CheckinSessionModule } from '../checkin-sessions/checkin-session.module';
import { NotificationModule } from '../notifications/notification.module';
import { OrganizerMemberModule } from '../organizer-members/organizer-member.module';
import { User, UserSchema } from '../users/user.entity';
import { UserModule } from '../users/user.module';
import { ComplaintAdminController } from './complaint-admin.controller';
import { ComplaintController } from './complaint.controller';
import { Complaint, ComplaintSchema } from './complaint.entity';
import { ComplaintAttachment, ComplaintAttachmentSchema } from './complaint-attachment.entity';
import { ComplaintHistory, ComplaintHistorySchema } from './complaint-history.entity';
import { ComplaintResponse, ComplaintResponseSchema } from './complaint-response.entity';
import { ComplaintRepository } from './complaint.repository';
import { ComplaintService } from './complaint.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Complaint.name, schema: ComplaintSchema },
            { name: ComplaintResponse.name, schema: ComplaintResponseSchema },
            { name: ComplaintAttachment.name, schema: ComplaintAttachmentSchema },
            { name: ComplaintHistory.name, schema: ComplaintHistorySchema },
            { name: User.name, schema: UserSchema },
        ]),
        ActivityModule,
        CheckinModule,
        CheckinSessionModule,
        NotificationModule,
        OrganizerMemberModule,
        UserModule,
    ],
    controllers: [ComplaintController, ComplaintAdminController],
    providers: [ComplaintService, ComplaintRepository, AuthGuard, AdminGuard, UploadService],
    exports: [ComplaintService],
})
export class ComplaintModule { }
