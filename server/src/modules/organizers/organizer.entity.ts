import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type OrganizerDocument = Organizer & Document;

@Schema({ timestamps: true })
export class Organizer {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true, default: 1 })
    status: number;
}

export const OrganizerSchema = SchemaFactory.createForClass(Organizer);
