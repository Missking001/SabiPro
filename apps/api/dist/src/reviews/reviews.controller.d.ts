import { ReviewsService } from './reviews.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto, FlagReviewDto } from './dto/reviews.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(dto: CreateReviewDto, user: AuthenticatedUser): Promise<{
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
    flag(id: string, dto: FlagReviewDto, user: AuthenticatedUser): Promise<{
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
