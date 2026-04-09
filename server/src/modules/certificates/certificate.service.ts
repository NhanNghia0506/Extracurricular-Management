import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import fontkit from '@pdf-lib/fontkit';
import { PDFFont, PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import { Model, Types } from 'mongoose';
import * as path from 'path';
import QRCode from 'qrcode';
import { CheckinStatus } from 'src/global/globalEnum';
import { ActivityStatus } from 'src/global/globalEnum';
import { CertificateVerifyResponse } from 'src/global/globalInterface';
import { Activity } from '../activities/activity.entity';
import { CheckinSession } from '../checkin-sessions/checkin-session.entity';
import { Checkin } from '../checkins/checkin.entity';
import { Certificate } from './certificate.entity';
import { User } from '../users/user.entity';
import { CertificateRepository } from './certificate.repository';

export interface IssueResult {
    issued: boolean;
    reason?: string;
    certificate?: unknown;
}

@Injectable()
export class CertificateService {
    private readonly logger = new Logger(CertificateService.name);

    constructor(
        private readonly certificateRepository: CertificateRepository,
        @InjectModel(Checkin.name) private readonly checkinModel: Model<Checkin>,
        @InjectModel(CheckinSession.name) private readonly checkinSessionModel: Model<CheckinSession>,
        @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
        @InjectModel(User.name) private readonly userModel: Model<User>,
    ) { }

    private normalizeText(value: string | undefined): string {
        if (!value) {
            return 'N/A';
        }

        return value
            .replace(/Đ/g, 'D')
            .replace(/đ/g, 'd')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    private async resolveFontFile(candidates: string[]): Promise<Buffer | null> {
        for (const candidate of candidates) {
            try {
                const bytes = await fs.readFile(candidate);
                return bytes;
            } catch {
                continue;
            }
        }

        return null;
    }

    private async loadFonts(pdfDoc: PDFDocument): Promise<{
        regular: PDFFont;
        bold: PDFFont;
        supportsUnicode: boolean;
    }> {
        const regularCandidates = [
            process.env.CERT_FONT_REGULAR_PATH,
            path.resolve(process.cwd(), 'src', 'assets', 'fonts', 'NotoSans-Regular.ttf'),
            path.resolve(process.cwd(), 'assets', 'fonts', 'NotoSans-Regular.ttf'),
            'C:/Windows/Fonts/arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/Library/Fonts/Arial Unicode.ttf',
        ].filter(Boolean) as string[];

        const boldCandidates = [
            process.env.CERT_FONT_BOLD_PATH,
            path.resolve(process.cwd(), 'src', 'assets', 'fonts', 'NotoSans-Bold.ttf'),
            path.resolve(process.cwd(), 'assets', 'fonts', 'NotoSans-Bold.ttf'),
            'C:/Windows/Fonts/arialbd.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/Library/Fonts/Arial Bold.ttf',
        ].filter(Boolean) as string[];

        const regularBytes = await this.resolveFontFile(regularCandidates);
        const boldBytes = await this.resolveFontFile(boldCandidates);

        if (regularBytes && boldBytes) {
            pdfDoc.registerFontkit(fontkit as Parameters<PDFDocument['registerFontkit']>[0]);

            const regular = await pdfDoc.embedFont(regularBytes, { subset: true });
            const bold = await pdfDoc.embedFont(boldBytes, { subset: true });

            return { regular, bold, supportsUnicode: true };
        }

        const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        return { regular, bold, supportsUnicode: false };
    }

    private pickText(value: string | undefined, supportsUnicode: boolean): string {
        if (supportsUnicode) {
            return (value || 'N/A').trim() || 'N/A';
        }

        return this.normalizeText(value);
    }

    private drawCenteredText(page: PDFPage, text: string, y: number, size: number, font: PDFFont, color = rgb(0, 0, 0)) {
        const width = page.getWidth();
        const textWidth = font.widthOfTextAtSize(text, size);
        const x = (width - textWidth) / 2;
        page.drawText(text, { x, y, size, font, color });
    }

    private getApiBaseUrl(): string {
        return process.env.PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT ?? 3001}`;
    }

    private buildCertificateCode(): string {
        return `CERT-${Date.now().toString(36).toUpperCase()}-${randomUUID().split('-')[0].toUpperCase()}`;
    }

    private getCertificateProofSecret(): string {
        const secret = process.env.CERTIFICATE_VERIFY_SECRET || process.env.JWT_SECRET;
        if (!secret) {
            this.logger.warn('Thiếu CERTIFICATE_VERIFY_SECRET/JWT_SECRET, dùng fallback secret yếu cho môi trường local');
            return 'dev-insecure-certificate-secret';
        }

        return secret;
    }

    private buildProofPayload(certificate: Pick<Certificate, 'certificateCode' | 'issuedAt' | 'userId' | 'activityId'>): string {
        return [
            certificate.certificateCode,
            new Date(certificate.issuedAt).toISOString(),
            certificate.userId.toString(),
            certificate.activityId.toString(),
        ].join('|');
    }

    private buildCertificateProofToken(certificate: Pick<Certificate, 'certificateCode' | 'issuedAt' | 'userId' | 'activityId'>): string {
        return createHmac('sha256', this.getCertificateProofSecret())
            .update(this.buildProofPayload(certificate))
            .digest('hex');
    }

    private hashProofToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private async resolveOrganizerInfo(activityId: Types.ObjectId): Promise<{ name: string; image: string }> {
        const activity = await this.activityModel
            .findById(activityId)
            .populate('organizerId', 'name image')
            .lean()
            .exec();

        const organizer = activity?.organizerId as { name?: string; image?: string } | Types.ObjectId | undefined;
        if (organizer && typeof organizer === 'object' && 'name' in organizer) {
            return {
                name: organizer.name || '',
                image: organizer.image || '',
            };
        }

        return {
            name: '',
            image: '',
        };
    }

    private isSameToken(left: string, right: string): boolean {
        const leftBuffer = Buffer.from(left);
        const rightBuffer = Buffer.from(right);

        if (leftBuffer.length !== rightBuffer.length) {
            return false;
        }

        return timingSafeEqual(leftBuffer, rightBuffer);
    }

    private async generateCertificatePdf(params: {
        recipientName: string;
        activityTitle: string;
        issuedAt: Date;
        certificateCode: string;
        verifyUrl: string;
    }): Promise<Uint8Array> {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]);
        const { width, height } = page.getSize();

        const { regular: fontRegular, bold: fontBold, supportsUnicode } = await this.loadFonts(pdfDoc);

        const recipientName = this.pickText(params.recipientName, supportsUnicode);
        const activityTitle = this.pickText(params.activityTitle, supportsUnicode);
        const issuedDateText = new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(params.issuedAt);

        page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.985, 0.988, 0.996) });
        page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, color: rgb(1, 1, 1) });
        page.drawRectangle({
            x: 28,
            y: 28,
            width: width - 56,
            height: height - 56,
            borderColor: rgb(0.11, 0.31, 0.73),
            borderWidth: 2,
        });
        page.drawRectangle({
            x: 42,
            y: 42,
            width: width - 84,
            height: height - 84,
            borderColor: rgb(0.86, 0.91, 0.98),
            borderWidth: 1,
        });

        // this.drawCenteredText(page, 'CHUNG NHAN HOAN THANH HOAT DONG', height - 82, 15, fontBold, rgb(0.08, 0.22, 0.52));
        this.drawCenteredText(page, this.pickText('CHỨNG NHẬN HOÀN THÀNH HOẠT ĐỘNG', supportsUnicode), height - 108, 28, fontBold, rgb(0.08, 0.22, 0.52));

        this.drawCenteredText(page, this.pickText('XÁC NHẬN RẰNG', supportsUnicode), height - 160, 12, fontRegular, rgb(0.37, 0.45, 0.6));
        this.drawCenteredText(page, recipientName, height - 210, 36, fontBold, rgb(0.02, 0.2, 0.39));
        page.drawLine({
            start: { x: 180, y: height - 218 },
            end: { x: width - 180, y: height - 218 },
            thickness: 1,
            color: rgb(0.78, 0.84, 0.94),
        });

        this.drawCenteredText(
            page,
            this.pickText('ĐÃ THAM GIA VÀ HOÀN THÀNH ĐẦY ĐỦ HOẠT ĐỘNG', supportsUnicode),
            height - 262,
            13,
            fontRegular,
            rgb(0.33, 0.39, 0.5),
        );
        this.drawCenteredText(page, activityTitle, height - 305, 24, fontBold, rgb(0.06, 0.33, 0.2));

        page.drawText(this.pickText('Ngày cấp', supportsUnicode), {
            x: 260,
            y: 130,
            size: 11,
            font: fontRegular,
            color: rgb(0.36, 0.43, 0.55),
        });
        page.drawText(this.pickText(issuedDateText, supportsUnicode), {
            x: 260,
            y: 112,
            size: 14,
            font: fontBold,
            color: rgb(0.1, 0.16, 0.3),
        });

        page.drawText(this.pickText('Mã chứng nhận', supportsUnicode), {
            x: 260,
            y: 86,
            size: 11,
            font: fontRegular,
            color: rgb(0.36, 0.43, 0.55),
        });
        page.drawText(params.certificateCode, {
            x: 260,
            y: 68,
            size: 12,
            font: fontBold,
            color: rgb(0.1, 0.16, 0.3),
        });

        page.drawText(this.pickText('Đơn vị xác nhận', supportsUnicode), {
            x: width - 250,
            y: 130,
            size: 11,
            font: fontRegular,
            color: rgb(0.36, 0.43, 0.55),
        });
        page.drawText(this.pickText('BAN TO CHUC HOAT DONG', supportsUnicode), {
            x: width - 250,
            y: 112,
            size: 14,
            font: fontBold,
            color: rgb(0.1, 0.16, 0.3),
        });

        const qrDataUrl = await (QRCode as {
            toDataURL: (text: string, options: { width: number; margin: number }) => Promise<string>;
        }).toDataURL(params.verifyUrl, {
            width: 170,
            margin: 1,
        });
        const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
        page.drawImage(qrImage, {
            x: 72,
            y: 62,
            width: 132,
            height: 132,
        });

        page.drawText(this.pickText('Quet QR de xac thuc chung nhan', supportsUnicode), {
            x: 58,
            y: 42,
            size: 11,
            font: fontRegular,
            color: rgb(0.28, 0.35, 0.48),
        });

        return pdfDoc.save();
    }

    async issueForCheckinSessionIfEligible(checkinSessionId: string, userId: string): Promise<IssueResult> {
        if (!Types.ObjectId.isValid(checkinSessionId) || !Types.ObjectId.isValid(userId)) {
            return { issued: false, reason: 'INVALID_INPUT' };
        }

        const session = await this.checkinSessionModel.findById(new Types.ObjectId(checkinSessionId)).exec();
        if (!session) {
            return { issued: false, reason: 'SESSION_NOT_FOUND' };
        }

        return this.issueForUserActivityIfEligible(userId, session.activityId.toString());
    }

    async issueForUserActivityIfEligible(userId: string, activityId: string): Promise<IssueResult> {
        if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(activityId)) {
            return { issued: false, reason: 'INVALID_INPUT' };
        }

        const existed = await this.certificateRepository.findByUserAndActivity(userId, activityId);
        if (existed) {
            return { issued: false, reason: 'ALREADY_ISSUED', certificate: existed };
        }

        const activity = await this.activityModel.findById(new Types.ObjectId(activityId)).exec();
        if (!activity) {
            return { issued: false, reason: 'ACTIVITY_NOT_FOUND' };
        }

        if (activity.status !== ActivityStatus.COMPLETED) {
            return { issued: false, reason: 'ACTIVITY_NOT_COMPLETED' };
        }

        const participant = await this.activityModel.db.collection('activityparticipants').findOne({
            activityId: new Types.ObjectId(activityId),
            userId: new Types.ObjectId(userId),
        }, {
            projection: { status: 1 },
        }) as { status?: string } | null;

        if (!participant || ['CANCELLED', 'REJECTED'].includes(String(participant.status || ''))) {
            return { issued: false, reason: 'PARTICIPANT_NOT_ELIGIBLE' };
        }

        const sessions = await this.checkinSessionModel
            .find({ activityId: new Types.ObjectId(activityId) })
            .select('_id')
            .lean()
            .exec();

        if (sessions.length === 0) {
            return { issued: false, reason: 'NO_SESSIONS' };
        }

        const sessionObjectIds = sessions.map((session) => session._id);

        const attendance = await this.checkinModel.aggregate<{ count: number }>([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    checkinSessionId: { $in: sessionObjectIds },
                    status: { $in: [CheckinStatus.SUCCESS, CheckinStatus.LATE] },
                },
            },
            { $group: { _id: '$checkinSessionId' } },
            { $count: 'count' },
        ]).exec();

        const attendedSessions = attendance[0]?.count || 0;
        const totalSessions = sessions.length;
        if (attendedSessions < totalSessions) {
            return { issued: false, reason: 'INSUFFICIENT_ATTENDANCE' };
        }

        const attendanceRate = 100;
        const issuedAt = new Date();
        const certificateCode = this.buildCertificateCode();
        const proofToken = this.buildCertificateProofToken({
            certificateCode,
            issuedAt,
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId),
        });

        const user = await this.userModel.findById(new Types.ObjectId(userId)).select('name email').lean().exec();
        const organizerInfo = await this.resolveOrganizerInfo(new Types.ObjectId(activityId));

        const created = await this.certificateRepository.create({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId),
            certificateCode,
            issuedAt,
            totalSessions,
            attendedSessions,
            attendanceRate,
            proofHash: this.hashProofToken(proofToken),
            meta: {
                userName: user?.name || 'User',
                userEmail: user?.email || '',
                activityTitle: activity.title,
                organizerName: organizerInfo.name || 'Ban tổ chức',
                organizerImage: organizerInfo.image || '',
            },
        });

        return {
            issued: true,
            certificate: created,
        };
    }

    async getMyCertificates(userId: string, page = 1, limit = 10) {
        const safePage = Number.isInteger(page) && page > 0 ? page : 1;
        const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10;

        const [items, total] = await Promise.all([
            this.certificateRepository.findByUser(userId, safePage, safeLimit),
            this.certificateRepository.countByUser(userId),
        ]);

        const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);

        return {
            items,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
                hasNextPage: safePage < totalPages,
                hasPrevPage: safePage > 1,
            },
        };
    }

    async getMyCertificateDetail(userId: string, certificateId: string) {
        if (!Types.ObjectId.isValid(certificateId)) {
            throw new BadRequestException('certificateId không hợp lệ');
        }

        const certificate = await this.certificateRepository.findByIdForUser(certificateId, userId);
        if (!certificate) {
            throw new NotFoundException('Không tìm thấy chứng nhận');
        }

        return certificate;
    }

    async getCertificateDownloadPdf(userId: string, certificateId: string): Promise<{ pdfBytes: Uint8Array; fileName: string; certificate: any }> {
        const certificate = await this.getMyCertificateDetail(userId, certificateId);

        const activity = await this.activityModel.findById(certificate.activityId).lean().exec();
        if (!activity) {
            throw new NotFoundException('Hoạt động không tồn tại');
        }

        const proofToken = this.buildCertificateProofToken(certificate);
        const verifyUrl = `${this.getApiBaseUrl()}/certificates/verify/${certificate.certificateCode}?proof=${proofToken}`;
        const userName = (certificate.meta?.userName as string) || 'User';
        const activityTitle = (certificate.meta?.activityTitle as string) || activity.title || 'Hoạt động';

        const pdfBytes = await this.generateCertificatePdf({
            recipientName: userName,
            activityTitle,
            issuedAt: certificate.issuedAt,
            certificateCode: certificate.certificateCode,
            verifyUrl,
        });

        const fileName = `CHUNG_CHI_${certificate.certificateCode}.pdf`;

        return {
            pdfBytes,
            fileName,
            certificate,
        };
    }

    async verifyCertificate(certificateCode: string, proof?: string): Promise<CertificateVerifyResponse> {
        const certificate = await this.certificateRepository.findByCode(certificateCode);
        if (!certificate) {
            return {
                valid: false,
                verificationStatus: 'NOT_FOUND',
            };
        }

        if (String(certificate.status) !== 'ISSUED') {
            return {
                valid: false,
                verificationStatus: 'REVOKED_OR_INVALID',
                certificateCode: certificate.certificateCode,
                issuedAt: certificate.issuedAt,
                status: String(certificate.status),
            };
        }

        const expectedToken = this.buildCertificateProofToken(certificate);
        const expectedProofHash = this.hashProofToken(expectedToken);
        const hasStoredProof = Boolean(certificate.proofHash);

        if (hasStoredProof && certificate.proofHash !== expectedProofHash) {
            this.logger.warn(`Phat hien mismatch proofHash noi bo cho chung nhan ${certificate.certificateCode}`);
            return {
                valid: false,
                verificationStatus: 'PROOF_MISMATCH',
                certificateCode: certificate.certificateCode,
                issuedAt: certificate.issuedAt,
                status: String(certificate.status),
            };
        }

        if (hasStoredProof && !proof) {
            return {
                valid: false,
                verificationStatus: 'PROOF_REQUIRED',
                certificateCode: certificate.certificateCode,
                issuedAt: certificate.issuedAt,
                status: String(certificate.status),
            };
        }

        if (proof && !this.isSameToken(proof, expectedToken)) {
            this.logger.warn(`Phat hien token verify khong hop le cho chung nhan ${certificate.certificateCode}`);
            return {
                valid: false,
                verificationStatus: 'PROOF_MISMATCH',
                certificateCode: certificate.certificateCode,
                issuedAt: certificate.issuedAt,
                status: String(certificate.status),
            };
        }

        const organizerInfo = await this.resolveOrganizerInfo(certificate.activityId);

        return {
            valid: true,
            verificationStatus: hasStoredProof ? 'VALID' : 'LEGACY_VALID',
            certificateCode: certificate.certificateCode,
            issuedAt: certificate.issuedAt,
            status: String(certificate.status),
            attendanceRate: certificate.attendanceRate,
            meta: {
                ...(certificate.meta || {}),
                organizerName: organizerInfo.name || (certificate.meta?.organizerName as string) || 'Ban tổ chức',
                organizerImage: organizerInfo.image || (certificate.meta?.organizerImage as string) || '',
            },
        };
    }
}