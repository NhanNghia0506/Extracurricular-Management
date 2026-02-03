import { Module } from '@nestjs/common';
import { ActivityParticipantService } from './activity-participant.service';
import { ActivityParticipantController } from './activity-participant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityParticipant, ActivityParticipantSchema } from './activity-participant.entity';
import { ActivityParticipantRepository } from './activity-participant.repository';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from 'src/guards/auth.guard';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ActivityParticipant.name, schema: ActivityParticipantSchema },
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [ActivityParticipantController],
    providers: [ActivityParticipantService, ActivityParticipantRepository, AuthGuard],
    exports: [ActivityParticipantService],
})
export class ActivityParticipantModule { }
