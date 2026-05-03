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
    const smtpFromAddress =
      process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? 'no-reply@optizenqor.app';
    const smtpFromName =
      process.env.SMTP_FROM_NAME?.trim() || 'OptiZenqor Socity';
    const smtpSecure = String(process.env.SMTP_SECURE ?? 'false') === 'true';
    const smtpFrom = this.formatFromAddress(smtpFromName, smtpFromAddress);
    const html = this.buildOtpEmailHtml({
      code: input.code,
      introText: input.introText,
      subject: input.subject,
    });
    const text = this.buildOtpEmailText({
      code: input.code,
      introText: input.introText,
      fallbackLabel: input.fallbackLabel,
    });

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
        text,
        html,
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

  private formatFromAddress(name: string, email: string) {
    const normalizedName = name.trim().replace(/"/g, '');
    const normalizedEmail = email.trim();
    return `"${normalizedName}" <${normalizedEmail}>`;
  }

  private buildOtpEmailText(input: {
    code: string;
    introText: string;
    fallbackLabel: string;
  }) {
    return [
      'OptiZenqor Socity',
      '',
      `${input.introText}: ${input.code}`,
      '',
      'This code is time-sensitive. Do not share it with anyone.',
      '',
      `If you did not request this, you can safely ignore this email.`,
      '',
      `${input.fallbackLabel}: ${input.code}`,
    ].join('\n');
  }

  private buildOtpEmailHtml(input: {
    code: string;
    introText: string;
    subject: string;
  }) {
    const escapedSubject = this.escapeHtml(input.subject);
    const escapedIntro = this.escapeHtml(input.introText);
    const escapedCode = this.escapeHtml(input.code);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedSubject}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#102033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 18px 48px rgba(16,32,51,0.14);">
            <tr>
              <td style="padding:0;background:linear-gradient(135deg,#07111f 0%,#103e6d 52%,#1da7b8 100%);">
                <div style="padding:36px 40px 28px;">
                  <div style="display:inline-block;padding:10px 16px;border:1px solid rgba(255,255,255,0.22);border-radius:999px;color:#d9f6ff;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;">
                    OptiZenqor Socity
                  </div>
                  <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.2;color:#ffffff;">Secure verification for your account</h1>
                  <p style="margin:0;color:rgba(255,255,255,0.84);font-size:15px;line-height:1.7;">
                    ${escapedIntro}. Please use the one-time code below to continue safely.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 12px;">
                <div style="text-align:center;padding:22px 16px;border-radius:22px;background:linear-gradient(180deg,#f8fbff 0%,#eff8ff 100%);border:1px solid #d7e8f8;">
                  <div style="margin-bottom:10px;font-size:12px;letter-spacing:1.4px;color:#50708d;text-transform:uppercase;">
                    Your 6-digit code
                  </div>
                  <div style="font-size:38px;line-height:1;font-weight:700;letter-spacing:12px;color:#0a2540;">
                    ${escapedCode}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0;">
                <p style="margin:0;font-size:15px;line-height:1.8;color:#334e68;">
                  This code is time-sensitive and should only be used on the official OptiZenqor Socity app or website.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0;">
                <div style="padding:18px 20px;border-radius:18px;background:#f6f9fc;border:1px solid #e3ebf3;">
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#16324a;">Security note</p>
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#5b7186;">
                    If you did not request this email, you can safely ignore it. Never share your verification code with anyone.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 38px;">
                <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#5b7186;">
                  Need help? Contact our team at
                  <a href="mailto:support@optizenqor.app" style="color:#0d7ea2;text-decoration:none;">support@optizenqor.app</a>.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.7;color:#89a0b6;">
                  Sent by OptiZenqor Socity. This is an automated message, so replies to this email may not be monitored.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
