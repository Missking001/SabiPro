import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto } from './dto/auth.dto';
import { MAX_LOGIN_ATTEMPTS, EMAIL_VERIFICATION_EXPIRY_HOURS, PASSWORD_RESET_EXPIRY_HOURS } from '../common/config/constants';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private loginAttempts: Map<string, { count: number; lockedUntil: Date | null }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.password.length < 8 || !/[A-Z]/.test(dto.password) || !/[0-9]/.test(dto.password) || !/[^A-Za-z0-9]/.test(dto.password)) {
      throw new BadRequestException('Password must be at least 8 characters with uppercase, number, and special character');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: dto.role as Role || Role.CONSUMER,
        phone: dto.phone || null,
        city: dto.city || null,
        isVerified: false,
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await this.mailService.sendVerificationEmail(user.email, user.name, verificationToken);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const attemptKey = `login:${email}`;
    const attempts = this.loginAttempts.get(attemptKey);

    if (attempts && attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked due to too many failed attempts. Check your email for unlock instructions.');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await this.recordFailedAttempt(attemptKey);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.recordFailedAttempt(attemptKey, user);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginAttempts.delete(attemptKey);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: dto.token,
        verificationTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    this.logger.log(`Email verified: ${user.email}`);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If that account exists, a verification email has been sent.' };
    }

    if (user.isVerified) {
      return { message: 'This email is already verified. Please log in.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, user.name, verificationToken);

    this.logger.log(`Verification email resent: ${user.email}`);

    return { message: 'If that account exists, a verification email has been sent.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: tokenExpiry,
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    this.logger.log(`Password reset requested for: ${email}`);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (dto.password.length < 8 || !/[A-Z]/.test(dto.password) || !/[0-9]/.test(dto.password) || !/[^A-Za-z0-9]/.test(dto.password)) {
      throw new BadRequestException('Password must be at least 8 characters with uppercase, number, and special character');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    this.logger.log(`Password reset completed: ${user.email}`);
    return { message: 'Password has been reset successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, phone: true, isVerified: true, createdAt: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async recordFailedAttempt(key: string, user?: any) {
    const entry = this.loginAttempts.get(key) || { count: 0, lockedUntil: null };
    entry.count += 1;
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
      entry.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      if (user) {
        this.mailService.sendLockoutEmail(user.email, user.name).catch((err) => {
          this.logger.error(`Failed to send lockout email to ${user.email}`, err);
        });
      }
    }
    this.loginAttempts.set(key, entry);
  }
}
