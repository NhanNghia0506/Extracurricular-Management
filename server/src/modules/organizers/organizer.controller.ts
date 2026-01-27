import { Controller, Get, Post, Body, Param, Put, Delete } from "@nestjs/common";
import { OrganizerService } from "./organizer.service";
import { CreateOrganizerDto } from "./dtos/create.organizer.dto";

@Controller("organizers")
export class OrganizerController {
    constructor(
        private readonly organizerService: OrganizerService
    ) {}

    @Post()
    create(@Body() createOrganizerDto: CreateOrganizerDto) {
        return this.organizerService.create(createOrganizerDto);
    }

    @Get()
    findAll() {
        return this.organizerService.findAll();
    }

    @Get(":id")
    findById(@Param("id") id: string) {
        return this.organizerService.findById(id);
    }

    @Put(":id")
    update(@Param("id") id: string, @Body() updateOrganizerDto: Partial<CreateOrganizerDto>) {
        return this.organizerService.update(id, updateOrganizerDto);
    }

    @Delete(":id")
    delete(@Param("id") id: string) {
        return this.organizerService.delete(id);
    }
}
