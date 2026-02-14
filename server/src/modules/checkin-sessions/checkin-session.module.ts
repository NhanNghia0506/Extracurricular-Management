import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ActivityModule } from '../activities/activity.module';
import { AuthGuard } from 'src/guards/auth.guard';
import { CheckinSessionController } from './checkin-session.controller';
import { CheckinSession, CheckinSessionSchema } from './checkin-session.entity';
import { CheckinSessionRepository } from './checkin-session.repository';
import { CheckinSessionService } from './checkin-session.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CheckinSession.name, schema: CheckinSessionSchema },
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        ActivityModule,
    ],
    controllers: [CheckinSessionController],
    providers: [CheckinSessionService, CheckinSessionRepository, AuthGuard],
    exports: [CheckinSessionService],
})
export class CheckinSessionModule { }
