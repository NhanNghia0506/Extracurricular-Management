import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'trangiannhannghia@gmail.com',
                pass: 'hwhu pzvf grpfagdv',
            },
        });
    }

    async onModuleInit(): Promise<void> {
        // Verify SMTP in background-friendly mode and never block app startup.
        const verifyPromise = this.transporter.verify();
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('SMTP verify timeout')), 5000);
        });

        try {
            await Promise.race([verifyPromise, timeoutPromise]);
            this.logger.log('Mail ready');
        } catch (error) {
            this.logger.warn(`Mail not ready: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendMail({ from, to, subject, text, html, attachments }: { from: string, to: string, subject: string, text: string, html?: string, attachments?: any[] }): Promise<void> {
        try {
            await this.transporter.sendMail({
                from,
                to,
                subject,
                ...(html ? { html } : { text }),
                attachments,
            });
        } catch (error) {
            console.error('Send mail error:', error);
            throw new Error('Không gửi được email');
        }
    }
}