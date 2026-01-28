import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ActivityCategory extends Document {
    @Prop({ required: true, unique: true })
    name: string;
}

export const ActivityCategorySchema = SchemaFactory.createForClass(ActivityCategory);
