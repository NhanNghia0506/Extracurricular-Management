import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityModule } from '../activities/activity.module';
import { UserModule } from '../users/user.module';
import { EventsModule } from 'src/events/events.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';
import { Comment, CommentSchema } from './comment.entity';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
        UserModule,
        ActivityModule,
        EventsModule,
    ],
    controllers: [CommentController],
    providers: [CommentService, CommentRepository],
    exports: [CommentService],
})
export class CommentModule { }
