import { AuthService } from './auth.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto, AdminRegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
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
    adminRegister(dto: AdminRegisterDto): Promise<{
        token: string;
    }>;
    getMe(user: AuthenticatedUser): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        avatarUrl: string | null;
        phone: string | null;
        isVerified: boolean;
        createdAt: Date;
    }>;
}
