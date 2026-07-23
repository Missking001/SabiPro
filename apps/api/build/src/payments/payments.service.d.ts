import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/payments.dto';
import { Prisma } from '@prisma/client';
export declare class PaymentsService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    saveBankDetails(userId: string, dto: {
        bankCode: string;
        accountNumber: string;
    }): Promise<{
        message: string;
    }>;
    getBankDetails(userId: string): Promise<{
        bankCode: any;
        accountNumber: any;
    }>;
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
        payouts: {
            id: string;
            createdAt: Date;
            bankCode: string;
            accountNumber: string;
            amount: number;
            status: import("@prisma/client").$Enums.PayoutState;
            gatewayRef: string | null;
            providerId: string;
            transactionId: string;
            platformFee: number;
            processedAt: Date | null;
        }[];
        provider: {
            id: string;
            userId: string;
            tradeCategory: string;
        };
        consumer: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        inquiryId: string | null;
        amount: number;
        currency: string;
        status: import("@prisma/client").$Enums.TxStatus;
        gatewayRef: string;
        gatewayStatus: string;
        payoutStatus: import("@prisma/client").$Enums.PayoutStatus;
        payoutReleasedAt: Date | null;
        metadata: Prisma.JsonValue | null;
        consumerId: string;
        providerId: string;
    }>;
    getConsumerHistory(userId: string): Promise<({
        provider: {
            slug: string;
            tradeCategory: string;
            user: {
                name: string;
                avatarUrl: string | null;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        inquiryId: string | null;
        amount: number;
        currency: string;
        status: import("@prisma/client").$Enums.TxStatus;
        gatewayRef: string;
        gatewayStatus: string;
        payoutStatus: import("@prisma/client").$Enums.PayoutStatus;
        payoutReleasedAt: Date | null;
        metadata: Prisma.JsonValue | null;
        consumerId: string;
        providerId: string;
    })[]>;
    getProviderHistory(userId: string): Promise<({
        consumer: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        inquiryId: string | null;
        amount: number;
        currency: string;
        status: import("@prisma/client").$Enums.TxStatus;
        gatewayRef: string;
        gatewayStatus: string;
        payoutStatus: import("@prisma/client").$Enums.PayoutStatus;
        payoutReleasedAt: Date | null;
        metadata: Prisma.JsonValue | null;
        consumerId: string;
        providerId: string;
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
