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
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto, AdminRegisterDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { MAX_LOGIN_ATTEMPTS, EMAIL_VERIFICATION_EXPIRY_HOURS, PASSWORD_RESET_EXPIRY_HOURS } from '../common/config/constants';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

    this.mailService.sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
      this.logger.error(`Failed to send verification email to ${user.email}: ${err.message}`);
    });

    this.logger.log(`User registered: ${user.email}`);

    return {
      user,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true, name: true, email: true, password: true, role: true,
        isActive: true, isVerified: true, tokenVersion: true,
        loginAttempts: true, lockedUntil: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked due to too many failed attempts. Check your email for unlock instructions.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (dto.role && dto.role !== 'ADMIN' && user.role !== dto.role) {
      throw new UnauthorizedException(
        `No ${dto.role.toLowerCase()} account found with this email. Please select the correct account type or create a new account.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.recordFailedAttempt(user);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Clear failed attempts on successful login
    if (user.loginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null },
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
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
      return { message: 'If that account exists, a verification email has been sent.' };
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

    this.mailService.sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
      this.logger.error(`Failed to resend verification email to ${user.email}: ${err.message}`);
    });

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

    this.mailService.sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) => {
      this.logger.error(`Failed to send password reset email to ${user.email}: ${err.message}`);
    });

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
        tokenVersion: { increment: 1 },
      },
    });

    this.logger.log(`Password reset completed: ${user.email}`);
    return { message: 'Password has been reset successfully. All sessions have been invalidated.' };
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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.newPassword.length < 8 || !/[A-Z]/.test(dto.newPassword) || !/[0-9]/.test(dto.newPassword) || !/[^A-Za-z0-9]/.test(dto.newPassword)) {
      throw new BadRequestException('Password must be at least 8 characters with uppercase, number, and special character');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    return { message: 'Password changed successfully. All other sessions have been invalidated.' };
  }

  async adminRegister(dto: AdminRegisterDto) {
    const adminCode = (process.env.ADMIN_SECRET_CODE || '').replace(/^["']|["']$/g, '').trim();
    const trimmedCode = dto.code.trim();
    this.logger.log(`Admin login attempt — provided length: ${trimmedCode.length}, env var length: ${adminCode.length}`);
    if (!adminCode || trimmedCode !== adminCode) {
      this.logger.warn(`Admin login failed — mismatch. Check that ADMIN_SECRET_CODE in Render env has no quotes.`);
      throw new UnauthorizedException('Invalid admin code');
    }

    let admin = await this.prisma.user.findFirst({
      where: { role: Role.ADMIN },
      select: { id: true, name: true, email: true, role: true, isActive: true, tokenVersion: true },
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), SALT_ROUNDS);
      admin = await this.prisma.user.create({
        data: {
          name: 'Administrator',
          email: 'admin@sabipro.com',
          password: hashedPassword,
          role: Role.ADMIN,
          isVerified: true,
        },
      });
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is suspended');
    }

    const token = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      tokenVersion: admin.tokenVersion,
    });

    this.logger.log(`Admin login: ${admin.email}`);

    return {
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  private async recordFailedAttempt(user: { id: string; email: string; name: string; loginAttempts: number }) {
    const newAttempts = user.loginAttempts + 1;
    const updateData: { loginAttempts: number; lockedUntil?: Date } = { loginAttempts: newAttempts };

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      this.mailService.sendLockoutEmail(user.email, user.name).catch((err) => {
        this.logger.error(`Failed to send lockout email to ${user.email}`, err);
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }
}
