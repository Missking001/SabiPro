import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto, SearchProvidersDto } from './dto/providers.dto';
import { DEFAULT_PAGE_SIZE } from '../common/config/constants';
import { OnboardingState, Role } from '@prisma/client';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchProvidersDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const where: any = {
      onboardingState: { in: [OnboardingState.ACTIVE, OnboardingState.VERIFIED] },
      isAvailable: true,
      user: { isActive: true },
    };

    if (dto.tradeCategory) {
      where.tradeCategory = { contains: dto.tradeCategory, mode: 'insensitive' };
    }
    if (dto.location) {
      where.location = { contains: dto.location, mode: 'insensitive' };
    }
    if (dto.minRating) {
      where.averageRating = { gte: dto.minRating };
    }
    if (dto.search) {
      where.OR = [
        { tradeCategory: { contains: dto.search, mode: 'insensitive' } },
        { location: { contains: dto.search, mode: 'insensitive' } },
        { bio: { contains: dto.search, mode: 'insensitive' } },
        { user: { name: { contains: dto.search, mode: 'insensitive' } } },
      ];
    }

    const [providers, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { averageRating: 'desc' },
        select: {
          id: true,
          slug: true,
          tradeCategory: true,
          location: true,
          bio: true,
          priceRangeMin: true,
          priceRangeMax: true,
          averageRating: true,
          totalReviews: true,
          isVerified: true,
          isAvailable: true,
          onboardingState: true,
          user: { select: { name: true, avatarUrl: true } },
          vettingBadge: { select: { badgeType: true, isActive: true } },
        },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return {
      data: providers,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findBySlug(slug: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        tradeCategory: true,
        location: true,
        bio: true,
        portfolioUrls: true,
        priceRangeMin: true,
        priceRangeMax: true,
        averageRating: true,
        totalReviews: true,
        isAvailable: true,
        isVerified: true,
        onboardingState: true,
        createdAt: true,
        user: { select: { name: true, avatarUrl: true } },
        vettingBadge: { select: { badgeType: true, isActive: true } },
        reviews: {
          where: { isVisible: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            consumer: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (provider.onboardingState === OnboardingState.REGISTERED || provider.onboardingState === OnboardingState.PROFILE_COMPLETE) {
      throw new NotFoundException('This profile is no longer available');
    }

    return provider;
  }

  async create(userId: string, dto: CreateProviderDto) {
    const existing = await this.prisma.provider.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('You already have a provider profile');
    }

    const slug = this.generateSlug(dto.tradeCategory, dto.location, userId);

    const provider = await this.prisma.provider.create({
      data: {
        userId,
        slug,
        bio: dto.bio,
        tradeCategory: dto.tradeCategory.trim(),
        location: dto.location.trim(),
        priceRangeMin: dto.priceRangeMin,
        priceRangeMax: dto.priceRangeMax,
        portfolioUrls: dto.portfolioUrls ?? [],
        onboardingState: OnboardingState.PROFILE_COMPLETE,
      },
      select: {
        id: true,
        slug: true,
        tradeCategory: true,
        location: true,
        onboardingState: true,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.PROVIDER },
    });

    return provider;
  }

  async update(id: string, userId: string, role: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (role !== Role.ADMIN && provider.userId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const data: any = {};
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.tradeCategory !== undefined) data.tradeCategory = dto.tradeCategory.trim();
    if (dto.location !== undefined) data.location = dto.location.trim();
    if (dto.priceRangeMin !== undefined) data.priceRangeMin = dto.priceRangeMin;
    if (dto.priceRangeMax !== undefined) data.priceRangeMax = dto.priceRangeMax;
    if (dto.isAvailable !== undefined) data.isAvailable = dto.isAvailable;
    if (dto.portfolioUrls !== undefined) data.portfolioUrls = dto.portfolioUrls;

    if (!provider.bio && dto.bio) {
      data.onboardingState = OnboardingState.PROFILE_COMPLETE;
    }

    return this.prisma.provider.update({
      where: { id },
      data,
      select: {
        id: true,
        slug: true,
        tradeCategory: true,
        location: true,
        bio: true,
        priceRangeMin: true,
        priceRangeMax: true,
        isAvailable: true,
        onboardingState: true,
      },
    });
  }

  async findByUser(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        tradeCategory: true,
        location: true,
        bio: true,
        portfolioUrls: true,
        priceRangeMin: true,
        priceRangeMax: true,
        averageRating: true,
        totalReviews: true,
        isAvailable: true,
        isVerified: true,
        onboardingState: true,
        createdAt: true,
        user: { select: { name: true, avatarUrl: true, email: true } },
        vettingBadge: { select: { badgeType: true, isActive: true } },
      },
    });
    return provider; // null if user has no provider profile yet
  }

  async deactivate(id: string, userId: string, role: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (role !== Role.ADMIN && provider.userId !== userId) {
      throw new ForbiddenException('You can only deactivate your own profile');
    }

    return this.prisma.provider.update({
      where: { id },
      data: { isAvailable: false },
      select: { id: true, isAvailable: true },
    });
  }

  private generateSlug(tradeCategory: string, location: string, userId: string): string {
    const trade = tradeCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const loc = location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const suffix = userId.slice(-6);
    return `${trade}-${loc}-${suffix}`;
  }
}
