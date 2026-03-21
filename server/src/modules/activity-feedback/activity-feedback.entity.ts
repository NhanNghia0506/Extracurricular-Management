import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityFeedbackDocument = ActivityFeedback & Document;

@Schema({ timestamps: true })
export class ActivityFeedback {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Activity', index: true })
    activityId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
    authorId: Types.ObjectId;

    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ required: true, maxlength: 300 })
    comment: string;

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}

export const ActivityFeedbackSchema = SchemaFactory.createForClass(ActivityFeedback);

ActivityFeedbackSchema.index({ activityId: 1, createdAt: -1 });
ActivityFeedbackSchema.index({ activityId: 1, authorId: 1 }, { unique: true });
