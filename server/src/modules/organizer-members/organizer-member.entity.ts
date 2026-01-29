import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { OrganizerMemberRole } from "src/global/globalEnum";

export type OrganizerMemberDocument = OrganizerMember & Document;

@Schema({ timestamps: true })
export class OrganizerMember {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Organizer' })
    organizerId: Types.ObjectId;

    @Prop({
        required: true,
        default: OrganizerMemberRole.MEMBER,
        enum: Object.values(OrganizerMemberRole)
    })
    role: OrganizerMemberRole;

    @Prop({ required: true, default: true })
    isActive: boolean;
}

export const OrganizerMemberSchema = SchemaFactory.createForClass(OrganizerMember);
