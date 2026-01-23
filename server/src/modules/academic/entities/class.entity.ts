import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
export type ClassDocument = Class & Document;
@Schema({ timestamps: true })
export class Class {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    classCode: string;

    @Prop({ required: true })
    facultyId: Types.ObjectId;
}

export const ClassSchema = SchemaFactory.createForClass(Class);