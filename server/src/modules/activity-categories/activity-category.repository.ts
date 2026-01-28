import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityCategory } from './activity-category.entity';

@Injectable()
export class ActivityCategoryRepository {
    constructor(
        @InjectModel(ActivityCategory.name) private activityCategoryModel: Model<ActivityCategory>
    ) {}

    create(activityCategoryData: any) {
        const activityCategory = new this.activityCategoryModel(activityCategoryData);
        return activityCategory.save();
    }

    findAll() {
        return this.activityCategoryModel.find().exec();
    }

    findById(id: string) {
        return this.activityCategoryModel.findById(id).exec();
    }

    update(id: string, activityCategoryData: any) {
        return this.activityCategoryModel.findByIdAndUpdate(id, activityCategoryData, { new: true }).exec();
    }

    delete(id: string) {
        return this.activityCategoryModel.findByIdAndDelete(id).exec();
    }

    findByName(name: string) {
        return this.activityCategoryModel.findOne({ name }).exec();
    }
}
