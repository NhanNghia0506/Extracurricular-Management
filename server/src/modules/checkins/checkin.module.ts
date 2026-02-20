import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckinController } from './checkin.controller';
import { Checkin, CheckinSchema } from './checkin.entity';
import { CheckinRepository } from './checkin.repository';
import { CheckinService } from './checkin.service';
import { CheckinSessionModule } from '../checkin-sessions/checkin-session.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Checkin.name, schema: CheckinSchema },
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        CheckinSessionModule,
    ],
    controllers: [CheckinController],
    providers: [CheckinService, CheckinRepository],
    exports: [CheckinService],
})
export class CheckinModule { }
