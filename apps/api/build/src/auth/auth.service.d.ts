import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto, AdminRegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly mailService;
    private readonly logger;
    private loginAttempts;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
        };
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        avatarUrl: string | null;
        phone: string | null;
        isVerified: boolean;
        createdAt: Date;
    }>;
    adminRegister(dto: AdminRegisterDto): Promise<{
        token: string;
    }>;
    private recordFailedAttempt;
}
