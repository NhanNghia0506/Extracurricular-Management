import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizerMember, OrganizerMemberSchema } from "./organizer-member.entity";
import { OrganizerMemberController } from "./organizer-member.controller";
import { OrganizerMemberService } from "./organizer-member.service";
import { OrganizerMemberRepository } from "./organizer-member.repository";
import { UserModule } from "../users/user.module";

@Module({
    imports: [
        UserModule,
        MongooseModule.forFeature([
            { name: OrganizerMember.name, schema: OrganizerMemberSchema }
        ]),
    ],
    controllers: [OrganizerMemberController],
    providers: [OrganizerMemberService, OrganizerMemberRepository],
    exports: [OrganizerMemberService, OrganizerMemberRepository],
})
export class OrganizerMemberModule { }
