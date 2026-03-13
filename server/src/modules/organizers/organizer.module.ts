import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Organizer, OrganizerSchema } from "./organizer.entity";
import { OrganizerController } from "./organizer.controller";
import { OrganizerService } from "./organizer.service";
import { OrganizerRepository } from "./organizer.repository";
import { OrganizerMemberModule } from "../organizer-members/organizer-member.module";
import { UserModule } from "../users/user.module";
import { NotificationModule } from "../notifications/notification.module";
import { UploadService } from "src/interceptors/upload.service";
import { AuthGuard } from "src/guards/auth.guard";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Organizer.name, schema: OrganizerSchema }
        ]),
        OrganizerMemberModule,
        UserModule,
        NotificationModule,
    ],
    controllers: [OrganizerController],
    providers: [OrganizerService, OrganizerRepository, UploadService, AuthGuard],
    exports: [OrganizerService, OrganizerRepository],
})
export class OrganizerModule { }
