import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeacherDocument = Teacher & Document;
@Schema({ timestamps: true })
export class Teacher {
    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    })
    userId: Types.ObjectId;

    @Prop({
        required: true,
        unique: true,
    })
    teacherCode: string;

    @Prop({
        type: Types.ObjectId,
        ref: 'Faculty',
        required: true,
    })
    facultyId: Types.ObjectId;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);
