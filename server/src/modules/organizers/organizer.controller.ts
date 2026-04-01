import { Controller, Get, Post, Body, Param, Put, Delete, Req, UploadedFile, UseGuards, UseInterceptors, Patch, Query } from "@nestjs/common";
import { OrganizerService } from "./organizer.service";
import { CreateOrganizerDto } from "./dtos/create.organizer.dto";
import { AuthGuard } from "src/guards/auth.guard";
import { createUploadImageInterceptor } from "src/interceptors/upload-image.interceptor";
import { UploadService } from "src/interceptors/upload.service";
import type { Request as ExpressRequest } from 'express';
import { OrganizerApprovalQueryDto } from "./dtos/organizer-approval-query.dto";
import { UpdateOrganizerApprovalDto } from "./dtos/update-organizer-approval.dto";
import { UpdateOrganizerDto } from "./dtos/update.organizer.dto";
import { AdminGuard } from "src/guards/admin.guard";
import { OrganizerStatsQueryDto } from "./dtos/organizer-stats.query.dto";

@Controller("organizers")
export class OrganizerController {
    constructor(
        private readonly organizerService: OrganizerService,
        private readonly uploadService: UploadService,
    ) { }

    @Post()
    @UseGuards(AuthGuard)
    @UseInterceptors(createUploadImageInterceptor())
    async create(
        @Body() createOrganizerDto: CreateOrganizerDto,
        @Req() req: ExpressRequest,
        @UploadedFile() file: Express.Multer.File | undefined,
    ) {
        const uploadedFilename = file?.filename;

        try {
            if (uploadedFilename) {
                createOrganizerDto.image = uploadedFilename;
            }

            return await this.organizerService.create(req.user!.id!, createOrganizerDto);
        } catch (error) {
            if (uploadedFilename) {
                this.uploadService.deleteFile(uploadedFilename);
            }
            throw error;
        }
    }

    @Get()
    findAll() {
        return this.organizerService.findAll();
    }

    @Get('admin/approval')
    @UseGuards(AuthGuard)
    getApprovalDashboard(
        @Req() req: ExpressRequest,
        @Query() query: OrganizerApprovalQueryDto,
    ) {
        return this.organizerService.getApprovalDashboard(req.user?.role, query);
    }

    @Get('admin/stats')
    @UseGuards(AuthGuard, AdminGuard)
    getOrganizerStats(@Query() query: OrganizerStatsQueryDto) {
        return this.organizerService.getOrganizerStats(query);
    }

    @Get('admin/approval/:id')
    @UseGuards(AuthGuard)
    getApprovalDetail(
        @Param('id') id: string,
        @Req() req: ExpressRequest,
    ) {
        return this.organizerService.getApprovalDetail(id, req.user?.role);
    }

    @Patch('admin/approval/:id')
    @UseGuards(AuthGuard)
    reviewOrganizer(
        @Param('id') id: string,
        @Body() reviewDto: UpdateOrganizerApprovalDto,
        @Req() req: ExpressRequest,
    ) {
        return this.organizerService.reviewOrganizer(id, req.user!.id!, req.user?.role, reviewDto);
    }

    @Get(':id/overview')
    getOverview(@Param('id') id: string) {
        return this.organizerService.getOrganizerOverview(id);
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.organizerService.findById(id);
    }

    @Put(":id")
    @UseGuards(AuthGuard)
    @UseInterceptors(createUploadImageInterceptor())
    async update(
        @Param("id") id: string,
        @Body() updateOrganizerDto: UpdateOrganizerDto,
        @Req() req: ExpressRequest,
        @UploadedFile() file: Express.Multer.File | undefined,
    ) {
        const uploadedFilename = file?.filename;

        try {
            if (uploadedFilename) {
                updateOrganizerDto.image = uploadedFilename;
            }

            return await this.organizerService.updateOrganizerByManager(
                id,
                req.user!.id!,
                updateOrganizerDto,
            );
        } catch (error) {
            if (uploadedFilename) {
                this.uploadService.deleteFile(uploadedFilename);
            }
            throw error;
        }
    }

    @Delete(":id")
    delete(@Param("id") id: string) {
        return this.organizerService.delete(id);
    }
}
