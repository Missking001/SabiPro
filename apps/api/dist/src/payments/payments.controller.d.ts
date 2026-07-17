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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    consumerHistory(user: AuthenticatedUser): Promise<({
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    providerHistory(user: AuthenticatedUser): Promise<({
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
