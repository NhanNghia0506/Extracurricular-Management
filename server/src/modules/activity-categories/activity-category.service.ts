import { Injectable } from '@nestjs/common';
import { ActivityCategoryRepository } from './activity-category.repository';
import { CreateActivityCategoryDto } from './dtos/create.activity-category.dto';

@Injectable()
export class ActivityCategoryService {
    constructor(private readonly activityCategoryRepository: ActivityCategoryRepository) {}

    create(createActivityCategoryDto: CreateActivityCategoryDto) {
        return this.activityCategoryRepository.create(createActivityCategoryDto);
    }

    findAll() {
        return this.activityCategoryRepository.findAll();
    }

    findById(id: string) {
        return this.activityCategoryRepository.findById(id);
    }

    update(id: string, updateActivityCategoryDto: CreateActivityCategoryDto) {
        return this.activityCategoryRepository.update(id, updateActivityCategoryDto);
    }

    delete(id: string) {
        return this.activityCategoryRepository.delete(id);
    }

    findByName(name: string) {
        return this.activityCategoryRepository.findByName(name);
    }
}
