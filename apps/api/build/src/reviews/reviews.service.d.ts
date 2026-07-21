import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, FlagReviewDto } from './dto/reviews.dto';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(consumerId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        comment: string | null;
        isVisible: boolean;
        isFlagged: boolean;
        flaggedAt: Date | null;
        consumerId: string;
        providerId: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    flag(id: string, userId: string, dto: FlagReviewDto): Promise<{
        message: string;
    }>;
    getProviderReviews(providerId: string): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        comment: string | null;
        consumer: {
            name: string;
            avatarUrl: string | null;
        };
    }[]>;
}
