import { AdminService } from './admin.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    approveVetting(id: string, badgeType: string, user: AuthenticatedUser): Promise<{
        id: string;
        isActive: boolean;
        providerId: string;
        badgeType: import("@prisma/client").$Enums.BadgeType;
        issuedAt: Date;
        expiresAt: Date | null;
        issuedBy: string;
    }>;
    revokeBadge(id: string): Promise<{
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
        reason: string | null;
        targetId: string;
        targetType: import("@prisma/client").$Enums.FlagTarget;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        reportedBy: string;
    })[]>;
    resolveFlag(id: string, action: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    suspendUser(id: string): Promise<{
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
        amount: number;
        inquiryId: string | null;
        gatewayRef: string;
        currency: string;
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
