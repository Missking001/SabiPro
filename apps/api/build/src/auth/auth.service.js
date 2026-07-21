"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const constants_1 = require("../common/config/constants");
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
const SALT_ROUNDS = 12;
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    mailService;
    logger = new common_1.Logger(AuthService_1.name);
    loginAttempts = new Map();
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        if (dto.password.length < 8 || !/[A-Z]/.test(dto.password) || !/[0-9]/.test(dto.password) || !/[^A-Za-z0-9]/.test(dto.password)) {
            throw new common_1.BadRequestException('Password must be at least 8 characters with uppercase, number, and special character');
        }
        const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + constants_1.EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name.trim(),
                email: dto.email.toLowerCase().trim(),
                password: hashedPassword,
                role: dto.role || client_1.Role.CONSUMER,
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
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        const attemptKey = `login:${email}`;
        const attempts = this.loginAttempts.get(attemptKey);
        if (attempts && attempts.lockedUntil && attempts.lockedUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account is locked due to too many failed attempts. Check your email for unlock instructions.');
        }
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            await this.recordFailedAttempt(attemptKey);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Your account has been suspended');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            await this.recordFailedAttempt(attemptKey, user);
            throw new common_1.UnauthorizedException('Invalid email or password');
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
    async verifyEmail(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                verificationToken: dto.token,
                verificationTokenExpiry: { gte: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
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
    async resendVerification(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { message: 'If that account exists, a verification email has been sent.' };
        }
        if (user.isVerified) {
            return { message: 'This email is already verified. Please log in.' };
        }
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + constants_1.EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
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
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { message: 'If that email exists, a reset link has been sent.' };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + constants_1.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);
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
    async resetPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: dto.token,
                resetTokenExpiry: { gte: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        if (dto.password.length < 8 || !/[A-Z]/.test(dto.password) || !/[0-9]/.test(dto.password) || !/[^A-Za-z0-9]/.test(dto.password)) {
            throw new common_1.BadRequestException('Password must be at least 8 characters with uppercase, number, and special character');
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
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, phone: true, isVerified: true, createdAt: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
    async recordFailedAttempt(key, user) {
        const entry = this.loginAttempts.get(key) || { count: 0, lockedUntil: null };
        entry.count += 1;
        if (entry.count >= constants_1.MAX_LOGIN_ATTEMPTS) {
            entry.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            if (user) {
                this.mailService.sendLockoutEmail(user.email, user.name).catch((err) => {
                    this.logger.error(`Failed to send lockout email to ${user.email}`, err);
                });
            }
        }
        this.loginAttempts.set(key, entry);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map