import { Role } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    iat: number;
    exp: number;
}
export interface AuthenticatedUser {
    userId: string;
    email: string;
    role: Role;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
