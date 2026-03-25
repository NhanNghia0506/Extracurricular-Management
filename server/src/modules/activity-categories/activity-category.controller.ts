import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ActivityCategoryService } from './activity-category.service';
import { CreateActivityCategoryDto } from './dtos/create.activity-category.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('activity-categories')
export class ActivityCategoryController {
    constructor(private readonly activityCategoryService: ActivityCategoryService) { }

    @Post()
    @UseGuards(AuthGuard, AdminGuard)
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
    @UseGuards(AuthGuard, AdminGuard)
    update(@Param('id') id: string, @Body() updateActivityCategoryDto: CreateActivityCategoryDto) {
        return this.activityCategoryService.update(id, updateActivityCategoryDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, AdminGuard)
    delete(@Param('id') id: string) {
        return this.activityCategoryService.delete(id);
    }
}
