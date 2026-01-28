import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ActivityCategoryService } from './activity-category.service';
import { CreateActivityCategoryDto } from './dtos/create.activity-category.dto';

@Controller('activity-categories')
export class ActivityCategoryController {
    constructor(private readonly activityCategoryService: ActivityCategoryService) {}

    @Post()
    create(@Body() createActivityCategoryDto: CreateActivityCategoryDto) {
        return this.activityCategoryService.create(createActivityCategoryDto);
    }

    @Get()
    findAll() {
        return this.activityCategoryService.findAll();
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.activityCategoryService.findById(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateActivityCategoryDto: CreateActivityCategoryDto) {
        return this.activityCategoryService.update(id, updateActivityCategoryDto);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.activityCategoryService.delete(id);
    }
}
