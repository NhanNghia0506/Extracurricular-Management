import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CertificateStatus } from 'src/global/globalEnum';

export type CertificateDocument = Certificate & Document;

@Schema({ timestamps: true })
export class Certificate {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true, index: true })
    activityId: Types.ObjectId;

    @Prop({ required: true, unique: true, index: true })
    certificateCode: string;

    @Prop({ required: true })
    issuedAt: Date;

    @Prop({ required: true })
    totalSessions: number;

    @Prop({ required: true })
    attendedSessions: number;

    @Prop({ required: true })
    attendanceRate: number;

    @Prop({ required: true, enum: Object.values(CertificateStatus), default: CertificateStatus.ISSUED })
    status: CertificateStatus;

    // Hash của token xác thực do server tạo khi cấp chứng nhận.
    @Prop({ type: String, default: null, index: true })
    proofHash: string | null;

    @Prop({ type: Object })
    meta?: Record<string, unknown>;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);

CertificateSchema.index({ userId: 1, activityId: 1 }, { unique: true });