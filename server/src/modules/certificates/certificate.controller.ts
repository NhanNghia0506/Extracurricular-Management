import { Controller, Get, Param, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { CertificateVerifyResponse } from 'src/global/globalInterface';
import { AuthGuard } from 'src/guards/auth.guard';
import { CertificateService } from './certificate.service';

@Controller('certificates')
export class CertificateController {
    constructor(private readonly certificateService: CertificateService) { }

    @Get('verify/:certificateCode')
    @ResponseMessage('Xác minh chứng nhận thành công')
    verify(
        @Param('certificateCode') certificateCode: string,
        @Query('proof') proof?: string,
    ): Promise<CertificateVerifyResponse> {
        return this.certificateService.verifyCertificate(certificateCode, proof);
    }

    @Get('my-certificates')
    @UseGuards(AuthGuard)
    @ResponseMessage('Lấy danh sách chứng nhận thành công')
    getMyCertificates(
        @Req() req: Request,
        @Query('page') pageRaw?: string,
        @Query('limit') limitRaw?: string,
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        const page = pageRaw ? Number(pageRaw) : 1;
        const limit = limitRaw ? Number(limitRaw) : 10;
        return this.certificateService.getMyCertificates(userId, page, limit);
    }

    @Post('issue/activity/:activityId')
    @UseGuards(AuthGuard)
    @ResponseMessage('Kiểm tra và cấp chứng nhận thành công')
    issueForMyActivity(
        @Req() req: Request,
        @Param('activityId') activityId: string,
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.certificateService.issueForUserActivityIfEligible(userId, activityId);
    }

    @Get(':certificateId')
    @UseGuards(AuthGuard)
    @ResponseMessage('Lấy chi tiết chứng nhận thành công')
    getMyCertificateDetail(
        @Req() req: Request,
        @Param('certificateId') certificateId: string,
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.certificateService.getMyCertificateDetail(userId, certificateId);
    }

    @Get(':certificateId/download')
    @UseGuards(AuthGuard)
    async downloadMyCertificate(
        @Req() req: Request,
        @Param('certificateId') certificateId: string,
        @Res() res: Response,
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        const { pdfBytes, fileName } = await this.certificateService.getCertificateDownloadPdf(userId, certificateId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(Buffer.from(pdfBytes));
    }
}