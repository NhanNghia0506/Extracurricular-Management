import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from 'src/guards/auth.guard';
import { Activity, ActivitySchema } from '../activities/activity.entity';
import { CheckinSession, CheckinSessionSchema } from '../checkin-sessions/checkin-session.entity';
import { Checkin, CheckinSchema } from '../checkins/checkin.entity';
import { User, UserSchema } from '../users/user.entity';
import { UserModule } from '../users/user.module';
import { CertificateController } from './certificate.controller';
import { Certificate, CertificateSchema } from './certificate.entity';
import { CertificateRepository } from './certificate.repository';
import { CertificateService } from './certificate.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Certificate.name, schema: CertificateSchema },
            { name: Checkin.name, schema: CheckinSchema },
            { name: CheckinSession.name, schema: CheckinSessionSchema },
            { name: Activity.name, schema: ActivitySchema },
            { name: User.name, schema: UserSchema },
        ]),
        UserModule,
    ],
    controllers: [CertificateController],
    providers: [CertificateService, CertificateRepository, AuthGuard],
    exports: [CertificateService],
})
export class CertificateModule { }