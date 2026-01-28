import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityCategory, ActivityCategorySchema } from './activity-category.entity';
import { ActivityCategoryController } from './activity-category.controller';
import { ActivityCategoryService } from './activity-category.service';
import { ActivityCategoryRepository } from './activity-category.repository';

@Module({
    imports: [MongooseModule.forFeature([{ name: ActivityCategory.name, schema: ActivityCategorySchema }])],
    controllers: [ActivityCategoryController],
    providers: [ActivityCategoryService, ActivityCategoryRepository],
    exports: [ActivityCategoryService],
})
export class ActivityCategoryModule {}
