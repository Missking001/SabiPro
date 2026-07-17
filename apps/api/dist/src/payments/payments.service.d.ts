import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/payments.dto';
import { Prisma } from '@prisma/client';
export declare class PaymentsService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    private log;
    private verifyFlutterwaveTransaction;
    initiate(consumerId: string, dto: InitiatePaymentDto): Promise<{
        transactionId: string;
        gatewayRef: string;
        amount: number;
        paymentUrl: string;
    }>;
    handleWebhook(body: any, signature: string): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    }>;
    findOne(id: string, userId: string, role: string): Promise<{
        provider: {
            id: string;
            tradeCategory: string;
            userId: string;
        };
        payouts: {
            id: string;
            createdAt: Date;
            providerId: string;
            status: import("@prisma/client").$Enums.PayoutState;
            transactionId: string;
            gatewayRef: string | null;
            amount: number;
            platformFee: number;
            bankCode: string;
            accountNumber: string;
            processedAt: Date | null;
        }[];
        consumer: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        consumerId: string;
        providerId: string;
        status: import("@prisma/client").$Enums.TxStatus;
        gatewayRef: string;
        amount: number;
        currency: string;
        inquiryId: string | null;
        gatewayStatus: string;
        payoutStatus: import("@prisma/client").$Enums.PayoutStatus;
        payoutReleasedAt: Date | null;
        metadata: Prisma.JsonValue | null;
    }>;
    getConsumerHistory(userId: string): Promise<({
        provider: {
            user: {
                name: string;
                avatarUrl: string | null;
            };
            slug: string;
            tradeCategory: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        consumerId: string;
        providerId: string;
        status: import("@prisma/client").$Enums.TxStatus;
        gatewayRef: string;
        amount: number;
        currency: string;
        inquiryId: string | null;
        gatewayStatus: string;
        payoutStatus: import("@prisma/client").$Enums.PayoutStatus;
        payoutReleasedAt: Date | null;
        metadata: Prisma.JsonValue | null;
    })[]>;
    getProviderHistory(userId: string): Promise<({
        consumer: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        consumerId: string;
        providerId: string;
        status: import("@prisma/client").$Enums.TxStatus;
        gatewayRef: string;
        amount: number;
        currency: string;
        inquiryId: string | null;
        gatewayStatus: string;
        payoutStatus: import("@prisma/client").$Enums.PayoutStatus;
        payoutReleasedAt: Date | null;
        metadata: Prisma.JsonValue | null;
    })[]>;
    releasePayout(id: string, userId: string): Promise<{
        message: string;
        amount: number;
        platformFee: number;
    }>;
    dispute(id: string, userId: string): Promise<{
        message: string;
    }>;
    refund(id: string): Promise<{
        message: string;
    }>;
    autoReleasePayouts(): Promise<void>;
}
