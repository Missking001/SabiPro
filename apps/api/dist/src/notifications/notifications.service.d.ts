import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, Channel } from '@prisma/client';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        type: import("@prisma/client").$Enums.NotificationType;
        channel: import("@prisma/client").$Enums.Channel;
        isRead: boolean;
        relatedId: string | null;
        relatedType: string | null;
    }[]>;
    markAsRead(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        type: import("@prisma/client").$Enums.NotificationType;
        channel: import("@prisma/client").$Enums.Channel;
        isRead: boolean;
        relatedId: string | null;
        relatedType: string | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    create(data: {
        userId: string;
        type: NotificationType;
        message: string;
        channel?: Channel;
        relatedId?: string;
        relatedType?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        type: import("@prisma/client").$Enums.NotificationType;
        channel: import("@prisma/client").$Enums.Channel;
        isRead: boolean;
        relatedId: string | null;
        relatedType: string | null;
    }>;
}
