import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'trangiannhannghia@gmail.com',
                pass: 'hwhu pzvf grpfagdv',
            },
        });

        this.transporter.verify((err) => {
            if (err) console.error('Mail error:', err);
            else console.log('Mail ready');
        });
    }

    async sendMail({from, to, subject, text, html, attachments}: {from: string,to: string,subject: string,text: string,html?: string,attachments?: any[]}): Promise<void> {
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