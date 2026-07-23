import { PaymentsService } from './payments.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { InitiatePaymentDto } from './dto/payments.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    initiate(dto: InitiatePaymentDto, user: AuthenticatedUser): Promise<{
        transactionId: string;
        gatewayRef: string;
        amount: number;
        paymentUrl: string;
    }>;
    webhook(body: any, signature: string): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    }>;
    findOne(id: string, user: AuthenticatedUser): Promise<{
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        consumerId: string;
        providerId: string;
    }>;
    consumerHistory(user: AuthenticatedUser): Promise<({
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        consumerId: string;
        providerId: string;
    })[]>;
    providerHistory(user: AuthenticatedUser): Promise<({
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        consumerId: string;
        providerId: string;
    })[]>;
    releasePayout(id: string, user: AuthenticatedUser): Promise<{
        message: string;
        amount: number;
        platformFee: number;
    }>;
    dispute(id: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    refund(id: string): Promise<{
        message: string;
    }>;
}
