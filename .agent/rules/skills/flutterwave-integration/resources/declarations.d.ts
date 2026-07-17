declare module '@prisma/client' {
    export enum NotificationType {
        PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
        PAYMENT_FAILED = 'PAYMENT_FAILED',
        PAYOUT_RELEASED = 'PAYOUT_RELEASED',
        PAYOUT_WITHHELD = 'PAYOUT_WITHHELD',
    }
    export enum TxStatus {
        PENDING = 'PENDING',
        SUCCESSFUL = 'SUCCESSFUL',
        FAILED = 'FAILED',
    }
    export namespace Prisma {
        export type JsonObject = Record<string, any>;
    }
}

declare module '@nestjs/common' {
    export function Controller(path?: string): any;
    export function Post(path?: string): any;
    export function Headers(name?: string): any;
    export function Body(): any;
    export function Req(): any;
    export function HttpCode(code: number): any;
    export enum HttpStatus {
        OK = 200,
    }
    export class Logger {
        constructor(context?: string);
        log(message: any, ...optionalParams: any[]): void;
        error(message: any, ...optionalParams: any[]): void;
        warn(message: any, ...optionalParams: any[]): void;
    }
    export class BadRequestException extends Error {}
    export type RawBodyRequest<T> = T & { rawBody?: Buffer };
}

declare module 'express' {
    export interface Request {
        rawBody?: Buffer;
    }
}

declare module 'crypto' {
    export function createHmac(algorithm: string, key: string | Buffer): Hmac;
    export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
    export interface Hmac {
        update(data: string | Buffer): Hmac;
        digest(encoding: 'hex'): string;
    }
}

declare module '../prisma/prisma.service' {
    export class PrismaService {}
}

declare module '../notifications/notifications.service' {
    export class NotificationsService {}
}

// Global variable and type declarations for standalone Node.js environment:
declare const prisma: any;
declare const notifications: any;

declare const process: {
    env: Record<string, string | undefined>;
};

interface Buffer extends Uint8Array {
    toString(encoding?: string): string;
}
interface BufferConstructor {
    from(str: string, encoding?: string): Buffer;
    from(array: Uint8Array): Buffer;
}
declare const Buffer: BufferConstructor;
