import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationEmail(email: string, code: string) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM ?? 'no-reply@optizenqor.app';
    const smtpSecure = String(process.env.SMTP_SECURE ?? 'false') === 'true';

    if (
      !smtpHost ||
      !smtpUser ||
      !smtpPass ||
      smtpPass === 'YOUR_GMAIL_APP_PASSWORD'
    ) {
      this.logger.warn(
        `SMTP not configured. Verification code for ${email}: ${code}`,
      );
      return {
        mode: 'dev-fallback',
        delivered: false,
        message:
          'SMTP is not configured. Using development fallback verification code.',
        devCode: code,
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: 'Your OptiZenqor 6-digit verification code',
        text: `Your 6-digit verification code is: ${code}`,
        html: `<p>Your 6-digit verification code is: <strong>${code}</strong></p>`,
      });

      return {
        mode: 'smtp',
        delivered: true,
        message: '6-digit verification code email sent successfully.',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';

      this.logger.error(
        `SMTP send failed for ${email}. Falling back to dev code. ${message}`,
      );

      return {
        mode: 'smtp-error-fallback',
        delivered: false,
        message:
          'SMTP send failed. Using development fallback verification code.',
        errorHint: message,
        devCode: code,
      };
    }
  }
}
