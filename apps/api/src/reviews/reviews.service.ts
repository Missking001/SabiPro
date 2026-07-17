import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, FlagReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(consumerId: string, dto: CreateReviewDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
      select: { id: true, userId: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const existing = await this.prisma.review.findUnique({
      where: { consumerId_providerId: { consumerId, providerId: dto.providerId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this provider');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          consumerId,
          providerId: dto.providerId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      const aggregation = await tx.review.aggregate({
        where: { providerId: dto.providerId, isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.provider.update({
        where: { id: dto.providerId },
        data: {
          averageRating: aggregation._avg.rating || 0,
          totalReviews: aggregation._count.rating || 0,
        },
      });

      // Notify the provider about the new review
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: 'REVIEW_POSTED',
          message: `You received a new ${dto.rating}-star review.`,
          relatedId: newReview.id,
          relatedType: 'Review',
        },
      });

      return newReview;
    });

    return review;
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });

      const aggregation = await tx.review.aggregate({
        where: { providerId: review.providerId, isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.provider.update({
        where: { id: review.providerId },
        data: {
          averageRating: aggregation._avg.rating || 0,
          totalReviews: aggregation._count.rating || 0,
        },
      });
    });

    return { message: 'Review removed' };
  }

  async flag(id: string, userId: string, dto: FlagReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.contentFlag.create({
      data: {
        reportedBy: userId,
        targetId: id,
        targetType: 'REVIEW',
        reason: dto.reason,
      },
    });

    await this.prisma.review.update({
      where: { id },
      data: { isFlagged: true, flaggedAt: new Date() },
    });

    return { message: 'Review flagged for moderation' };
  }

  async getProviderReviews(providerId: string) {
    return this.prisma.review.findMany({
      where: { providerId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        consumer: { select: { name: true, avatarUrl: true } },
      },
    });
  }
}
