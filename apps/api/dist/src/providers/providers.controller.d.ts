import { ProvidersService } from './providers.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateProviderDto, UpdateProviderDto, SearchProvidersDto } from './dto/providers.dto';
export declare class ProvidersController {
    private readonly providersService;
    constructor(providersService: ProvidersService);
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
    getMyProfile(user: AuthenticatedUser): Promise<{
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
    create(dto: CreateProviderDto, user: AuthenticatedUser): Promise<{
        id: string;
        slug: string;
        tradeCategory: string;
        location: string;
        onboardingState: import("@prisma/client").$Enums.OnboardingState;
    }>;
    update(id: string, dto: UpdateProviderDto, user: AuthenticatedUser): Promise<{
        id: string;
        slug: string;
        bio: string | null;
        tradeCategory: string;
        location: string;
        priceRange: string | null;
        isAvailable: boolean;
        onboardingState: import("@prisma/client").$Enums.OnboardingState;
    }>;
    deactivate(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        isAvailable: boolean;
    }>;
}
