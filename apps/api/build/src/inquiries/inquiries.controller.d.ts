import { InquiriesService } from './inquiries.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateInquiryDto, UpdateInquiryStatusDto } from './dto/inquiries.dto';
export declare class InquiriesController {
    private readonly inquiriesService;
    constructor(inquiriesService: InquiriesService);
    findAll(user: AuthenticatedUser): Promise<({
        consumer: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        consumerId: string;
        providerId: string;
        message: string;
        status: import("@prisma/client").$Enums.InquiryStatus;
    })[] | ({
        provider: {
            id: string;
            user: {
                name: string;
                avatarUrl: string | null;
            };
            slug: string;
            tradeCategory: string;
            location: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        consumerId: string;
        providerId: string;
        message: string;
        status: import("@prisma/client").$Enums.InquiryStatus;
    })[]>;
    create(dto: CreateInquiryDto, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        status: import("@prisma/client").$Enums.InquiryStatus;
    }>;
    findOne(id: string, user: AuthenticatedUser): Promise<{
        provider: {
            id: string;
            tradeCategory: string;
            userId: string;
        };
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
        message: string;
        status: import("@prisma/client").$Enums.InquiryStatus;
    }>;
    updateStatus(id: string, dto: UpdateInquiryStatusDto, user: AuthenticatedUser): Promise<{
        id: string;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InquiryStatus;
    }>;
}
