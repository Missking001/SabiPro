import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto, UpdateInquiryStatusDto } from './dto/inquiries.dto';
export declare class InquiriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(consumerId: string, dto: CreateInquiryDto): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        status: import("@prisma/client").$Enums.InquiryStatus;
    }>;
    findOne(id: string, userId: string, role: string): Promise<{
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
    findForUser(userId: string, role: string): Promise<({
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
    updateStatus(id: string, userId: string, dto: UpdateInquiryStatusDto): Promise<{
        id: string;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InquiryStatus;
    }>;
}
