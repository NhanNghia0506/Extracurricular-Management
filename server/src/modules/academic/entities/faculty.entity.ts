import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
export type FacultyDocument = Faculty & Document;
@Schema({ timestamps: true })
export class Faculty {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    facultyCode: string;

    @Prop({ required: true, unique: true })
    email: string;
}

export const FacultySchema = SchemaFactory.createForClass(Faculty);