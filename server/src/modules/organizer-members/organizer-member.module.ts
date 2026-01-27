import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizerMember, OrganizerMemberSchema } from "./organizer-member.entity";
import { OrganizerMemberController } from "./organizer-member.controller";
import { OrganizerMemberService } from "./organizer-member.service";
import { OrganizerMemberRepository } from "./organizer-member.repository";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: OrganizerMember.name, schema: OrganizerMemberSchema }
        ]),
    ],
    controllers: [OrganizerMemberController],
    providers: [OrganizerMemberService, OrganizerMemberRepository],
    exports: [OrganizerMemberService, OrganizerMemberRepository],
})
export class OrganizerMemberModule {}
