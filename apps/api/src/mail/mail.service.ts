import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  async onModuleInit() {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    const mailHost = process.env.MAIL_HOST;

    const hasRealSmtp = mailUser && mailPass
      && mailUser !== 'dummy@ethereal.email'
      && mailPass !== 'dummy-pass'
      && mailHost && mailHost !== 'smtp.ethereal.email';

    if (hasRealSmtp) {
      this.transporter = nodemailer.createTransport({
        host: mailHost,
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        secure: false,
        auth: { user: mailUser, pass: mailPass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
      this.logger.log(`SMTP transport configured: ${mailHost} as ${mailUser}`);
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.warn(`Using Ethereal test email — emails will NOT reach a real inbox. Preview: https://ethereal.email/login`);
      this.logger.log(`Ethereal credentials — user: ${testAccount.user}, pass: ${testAccount.pass}`);
    }
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'}/verify-email?token=${token}`;

    const info = await this.transporter!.sendMail({
      from: '"SabiPro" <noreply@sabipro.com>',
      to,
      subject: 'Verify your SabiPro account',
      text: `Hi ${name},\n\nWelcome to SabiPro! Please verify your email by clicking the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, please ignore this email.\n\nBest,\nThe SabiPro Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #1A6B3C; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">SabiPro</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #ECEAE3;">
            <h2>Welcome, ${name}!</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #1A6B3C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Verify email</a>
            <p style="color: #888780; font-size: 12px;">This link expires in 24 hours. If you did not create an account, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`Verification email preview: ${previewUrl}`);
    }
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'}/reset-password?token=${token}`;

    const info = await this.transporter!.sendMail({
      from: '"SabiPro" <noreply@sabipro.com>',
      to,
      subject: 'Reset your SabiPro password',
      text: `Hi ${name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest,\nThe SabiPro Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #1A6B3C; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">SabiPro</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #ECEAE3;">
            <h2>Password reset</h2>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #1A6B3C; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Reset password</a>
            <p style="color: #888780; font-size: 12px;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`Password reset email preview: ${previewUrl}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const info = await this.transporter!.sendMail({
      from: '"SabiPro" <noreply@sabipro.com>',
      to,
      subject: 'Welcome to SabiPro!',
      text: `Hi ${name},\n\nWelcome to SabiPro! We're excited to have you on board.\n\nYour account has been created successfully. Please check your inbox for a verification email to activate your account.\n\nStart exploring trusted local service providers in your area today.\n\nBest,\nThe SabiPro Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #1A6B3C; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">SabiPro</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #ECEAE3;">
            <h2>Welcome to SabiPro, ${name}!</h2>
            <p>We're excited to have you on board.</p>
            <p>Your account has been created successfully. Please check your inbox for a verification email to activate your account.</p>
            <p style="margin-top: 16px;">Start exploring trusted local service providers in your area today.</p>
          </div>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`Welcome email preview: ${previewUrl}`);
    }
  }

  async sendPaymentReceiptEmail(to: string, name: string, amount: number, gatewayRef: string): Promise<void> {
    const info = await this.transporter!.sendMail({
      from: '"SabiPro" <noreply@sabipro.com>',
      to,
      subject: 'Payment Receipt — SabiPro',
      text: `Hi ${name},\n\nYour payment of ₦${(amount / 100).toLocaleString('en-NG')} has been confirmed.\n\nReference: ${gatewayRef}\n\nThe funds are held securely in escrow and will be released to the service provider once you confirm the job is complete.\n\nThank you for using SabiPro.\n\nBest,\nThe SabiPro Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #1A6B3C; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">SabiPro</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #ECEAE3;">
            <h2>Payment Confirmed</h2>
            <p>Hi ${name},</p>
            <p>Your payment has been successfully processed.</p>
            <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888780;">Amount</td><td style="padding: 8px 0; font-weight: 500;">₦${(amount / 100).toLocaleString('en-NG')}</td></tr>
              <tr><td style="padding: 8px 0; color: #888780;">Reference</td><td style="padding: 8px 0; font-weight: 500;">${gatewayRef}</td></tr>
            </table>
            <p>The funds are held securely in escrow and will be released to the service provider once you confirm the job is complete.</p>
          </div>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`Payment receipt email preview: ${previewUrl}`);
    }
  }

  async sendPayoutReleaseEmail(to: string, name: string, amount: number, transactionId: string): Promise<void> {
    const info = await this.transporter!.sendMail({
      from: '"SabiPro" <noreply@sabipro.com>',
      to,
      subject: 'Payout Released — SabiPro',
      text: `Hi ${name},\n\nA payout of ₦${(amount / 100).toLocaleString('en-NG')} has been released to your bank account.\n\nTransaction ref: ${transactionId.slice(0, 8)}...\n\nThank you for using SabiPro.\n\nBest,\nThe SabiPro Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #D4801A; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">SabiPro</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #ECEAE3;">
            <h2>Payout Released</h2>
            <p>Hi ${name},</p>
            <p>A payout has been released to your bank account.</p>
            <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888780;">Amount</td><td style="padding: 8px 0; font-weight: 500;">₦${(amount / 100).toLocaleString('en-NG')}</td></tr>
              <tr><td style="padding: 8px 0; color: #888780;">Transaction</td><td style="padding: 8px 0; font-weight: 500;">${transactionId.slice(0, 8)}...</td></tr>
            </table>
            <p>Thank you for using SabiPro.</p>
          </div>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`Payout release email preview: ${previewUrl}`);
    }
  }

  async sendLockoutEmail(to: string, name: string): Promise<void> {
    const info = await this.transporter!.sendMail({
      from: '"SabiPro" <noreply@sabipro.com>',
      to,
      subject: 'Temporary Lockout Notification',
      text: `Hi ${name},\n\nYour SabiPro account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.\n\nIf this was not you, please reset your password immediately to secure your account.\n\nBest,\nThe SabiPro Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #E24B4A; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">SabiPro</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #ECEAE3;">
            <h2>Account Temporarily Locked</h2>
            <p>Hi ${name},</p>
            <p>Your SabiPro account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.</p>
            <p>If you did not request this, please reset your password immediately to secure your account.</p>
            <p style="color: #888780; font-size: 12px;">This is an automated security notification.</p>
          </div>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`Lockout email preview: ${previewUrl}`);
    }
  }
}
