import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    approveVetting(providerId: string, badgeType: string, adminId: string): Promise<{
        id: string;
        isActive: boolean;
        providerId: string;
        badgeType: import("@prisma/client").$Enums.BadgeType;
        issuedAt: Date;
        expiresAt: Date | null;
        issuedBy: string;
    }>;
    revokeBadge(providerId: string): Promise<{
        message: string;
    }>;
    getFlags(): Promise<({
        reporter: {
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.FlagStatus;
        targetId: string;
        targetType: import("@prisma/client").$Enums.FlagTarget;
        reason: string | null;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        reportedBy: string;
    })[]>;
    resolveFlag(flagId: string, action: string, adminId: string): Promise<{
        message: string;
    }>;
    suspendUser(userId: string): Promise<{
        message: string;
    }>;
    getUsers(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    getTransactions(): Promise<{
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
    }[]>;
    getDashboard(): Promise<{
        totalUsers: number;
        activeProviders: number;
        totalInquiries: number;
        totalTransactions: number;
        platformRevenue: number;
        pendingVetting: number;
        pendingFlags: number;
    }>;
}
