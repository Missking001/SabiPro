export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    city?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class ResendVerificationDto {
    email: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
}
export declare class AdminRegisterDto {
    code: string;
}
