import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './activity.entity';
import { ActivityRepository } from './activity.repository';
import { UploadService } from '../../interceptors/upload.service';
import { ActivityParticipantModule } from '../activity-participants/activity-participant.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Activity.name, schema: ActivitySchema },
        ]),
        ActivityParticipantModule
    ],
    controllers: [ActivityController],
    providers: [ActivityService, ActivityRepository, UploadService],
    exports: [ActivityService],
})
export class ActivityModule { }
