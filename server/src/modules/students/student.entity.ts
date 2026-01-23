import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentDocument = Student & Document;
@Schema({ timestamps: true })
export class Student {
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
    studentCode: string; // MSSV

    @Prop({
        type: Types.ObjectId,
        ref: 'Faculty',
        required: true,
    })
    facultyId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Class',
        required: true,
    })
    classId: Types.ObjectId;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
