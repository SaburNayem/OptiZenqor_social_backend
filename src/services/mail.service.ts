import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationEmail(email: string, code: string) {
    return this.sendOtpEmail({
      email,
      code,
      subject: 'Your OptiZenqor 6-digit verification code',
      introText: 'Your 6-digit verification code is',
      fallbackLabel: 'Verification code',
    });
  }

  async sendPasswordResetEmail(email: string, code: string) {
    return this.sendOtpEmail({
      email,
      code,
      subject: 'Your OptiZenqor password reset code',
      introText: 'Your password reset code is',
      fallbackLabel: 'Password reset code',
    });
  }

  private async sendOtpEmail(input: {
    email: string;
    code: string;
    subject: string;
    introText: string;
    fallbackLabel: string;
  }) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);
    const smtpUser = process.env.SMTP_USER ?? process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS ?? process.env.EMAIL_PASSWORD;
    const smtpFrom =
      process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? 'no-reply@optizenqor.app';
    const smtpSecure = String(process.env.SMTP_SECURE ?? 'false') === 'true';

    if (
      !smtpHost ||
      !smtpUser ||
      !smtpPass ||
      smtpPass === 'YOUR_GMAIL_APP_PASSWORD'
    ) {
      this.logger.warn(
        `SMTP not configured. ${input.fallbackLabel} for ${input.email}: ${input.code}`,
      );
      return {
        mode: 'dev-fallback',
        delivered: false,
        message:
          'SMTP is not configured. Using development fallback OTP code.',
        devCode: input.code,
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
        to: input.email,
        subject: input.subject,
        text: `${input.introText}: ${input.code}`,
        html: `<p>${input.introText}: <strong>${input.code}</strong></p>`,
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
        `SMTP send failed for ${input.email}. Falling back to dev code. ${message}`,
      );

      return {
        mode: 'smtp-error-fallback',
        delivered: false,
        message:
          'SMTP send failed. Using development fallback verification code.',
        errorHint: message,
        devCode: input.code,
      };
    }
  }
}
