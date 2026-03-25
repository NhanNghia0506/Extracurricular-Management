import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityCategory, ActivityCategorySchema } from './activity-category.entity';
import { ActivityCategoryController } from './activity-category.controller';
import { ActivityCategoryService } from './activity-category.service';
import { ActivityCategoryRepository } from './activity-category.repository';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ActivityCategory.name, schema: ActivityCategorySchema }]),
        UserModule,
    ],
    controllers: [ActivityCategoryController],
    providers: [ActivityCategoryService, ActivityCategoryRepository],
    exports: [ActivityCategoryService],
})
export class ActivityCategoryModule { }
