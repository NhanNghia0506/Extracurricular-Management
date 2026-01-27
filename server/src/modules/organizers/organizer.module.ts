import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Organizer, OrganizerSchema } from "./organizer.entity";
import { OrganizerController } from "./organizer.controller";
import { OrganizerService } from "./organizer.service";
import { OrganizerRepository } from "./organizer.repository";
import { OrganizerMemberModule } from "../organizer-members/organizer-member.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Organizer.name, schema: OrganizerSchema }
        ]),
        OrganizerMemberModule,
    ],
    controllers: [OrganizerController],
    providers: [OrganizerService, OrganizerRepository],
    exports: [OrganizerService, OrganizerRepository],
})
export class OrganizerModule {}
