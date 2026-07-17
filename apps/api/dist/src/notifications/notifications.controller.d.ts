import { NotificationsService } from './notifications.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: AuthenticatedUser): Promise<{
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
    markAsRead(id: string, user: AuthenticatedUser): Promise<{
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
    markAllAsRead(user: AuthenticatedUser): Promise<{
        message: string;
    }>;
}
