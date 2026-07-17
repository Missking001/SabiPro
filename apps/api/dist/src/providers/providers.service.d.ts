import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto, SearchProvidersDto } from './dto/providers.dto';
export declare class ProvidersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(dto: SearchProvidersDto): Promise<{
        data: {
            id: string;
            isVerified: boolean;
            user: {
                name: string;
                avatarUrl: string | null;
            };
            slug: string;
            bio: string | null;
            tradeCategory: string;
            location: string;
            priceRange: string | null;
            isAvailable: boolean;
            onboardingState: import("@prisma/client").$Enums.OnboardingState;
            averageRating: number;
            totalReviews: number;
            vettingBadge: {
                isActive: boolean;
                badgeType: import("@prisma/client").$Enums.BadgeType;
            } | null;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    findBySlug(slug: string): Promise<{
        id: string;
        isVerified: boolean;
        createdAt: Date;
        reviews: {
            id: string;
            createdAt: Date;
            rating: number;
            comment: string | null;
            consumer: {
                name: string;
                avatarUrl: string | null;
            };
        }[];
        user: {
            name: string;
            avatarUrl: string | null;
        };
        slug: string;
        bio: string | null;
        tradeCategory: string;
        location: string;
        portfolioUrls: string[];
        priceRange: string | null;
        isAvailable: boolean;
        onboardingState: import("@prisma/client").$Enums.OnboardingState;
        averageRating: number;
        totalReviews: number;
        vettingBadge: {
            isActive: boolean;
            badgeType: import("@prisma/client").$Enums.BadgeType;
        } | null;
    }>;
    create(userId: string, dto: CreateProviderDto): Promise<{
        id: string;
        slug: string;
        tradeCategory: string;
        location: string;
        onboardingState: import("@prisma/client").$Enums.OnboardingState;
    }>;
    update(id: string, userId: string, role: string, dto: UpdateProviderDto): Promise<{
        id: string;
        slug: string;
        bio: string | null;
        tradeCategory: string;
        location: string;
        priceRange: string | null;
        isAvailable: boolean;
        onboardingState: import("@prisma/client").$Enums.OnboardingState;
    }>;
    findByUser(userId: string): Promise<{
        id: string;
        isVerified: boolean;
        createdAt: Date;
        user: {
            email: string;
            name: string;
            avatarUrl: string | null;
        };
        slug: string;
        bio: string | null;
        tradeCategory: string;
        location: string;
        portfolioUrls: string[];
        priceRange: string | null;
        isAvailable: boolean;
        onboardingState: import("@prisma/client").$Enums.OnboardingState;
        averageRating: number;
        totalReviews: number;
        vettingBadge: {
            isActive: boolean;
            badgeType: import("@prisma/client").$Enums.BadgeType;
        } | null;
    } | null>;
    deactivate(id: string, userId: string, role: string): Promise<{
        id: string;
        isAvailable: boolean;
    }>;
    private generateSlug;
}
