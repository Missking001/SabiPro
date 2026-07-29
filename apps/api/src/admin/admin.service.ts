import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType, OnboardingState, FlagStatus, FlagTarget, NotificationType } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async approveVetting(providerId: string, badgeType: string, adminId: string) {
    if (!Object.values(BadgeType).includes(badgeType as BadgeType)) {
      throw new BadRequestException(`Invalid badge type. Must be one of: ${Object.values(BadgeType).join(', ')}`);
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { vettingBadge: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (provider.vettingBadge) {
      throw new ConflictException('Provider already has a vetting badge');
    }
    if (provider.onboardingState !== OnboardingState.ACTIVE) {
      throw new BadRequestException('Provider must be in ACTIVE state before verification');
    }

    const badge = await this.prisma.$transaction(async (tx) => {
      const b = await tx.vettingBadge.create({
        data: {
          providerId,
          badgeType: badgeType as BadgeType,
          issuedBy: adminId,
        },
      });
      await tx.provider.update({
        where: { id: providerId },
        data: {
          isVerified: true,
          onboardingState: OnboardingState.VERIFIED,
        },
      });

      // Notify the provider that they received a vetting badge
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: NotificationType.BADGE_ISSUED,
          message: 'Congratulations! Your profile has been verified and a vetting badge has been issued.',
          relatedId: providerId,
          relatedType: 'Provider',
        },
      });

      return b;
    });

    this.logger.log(`Vetting badge issued for provider ${providerId}`);

    return badge;
  }

  async approveProvider(providerId: string, adminId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, onboardingState: true, userId: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (provider.onboardingState !== OnboardingState.PROFILE_COMPLETE) {
      throw new BadRequestException('Provider must be in PROFILE_COMPLETE state before approval');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.provider.update({
        where: { id: providerId },
        data: { onboardingState: OnboardingState.ACTIVE },
      });

      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: NotificationType.BADGE_ISSUED,
          message: 'Your profile has been approved. You are now visible to consumers searching on SabiPro.',
          relatedId: providerId,
          relatedType: 'Provider',
        },
      });
    });

    this.logger.log(`Provider ${providerId} approved by admin ${adminId}`);
    return { message: 'Provider approved successfully' };
  }

  async revokeBadge(providerId: string) {
    const badge = await this.prisma.vettingBadge.findUnique({
      where: { providerId },
    });
    if (!badge) {
      throw new NotFoundException('No vetting badge found for this provider');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.vettingBadge.update({
        where: { providerId },
        data: { isActive: false },
      });
      await tx.provider.update({
        where: { id: providerId },
        data: {
          isVerified: false,
          onboardingState: OnboardingState.ACTIVE,
        },
      });

      // Notify the provider that their badge has been revoked
      if (provider) {
        await tx.notification.create({
          data: {
            userId: provider.userId,
            type: NotificationType.BADGE_REVOKED,
            message: 'Your vetting badge has been revoked. Your profile is still active.',
            relatedId: providerId,
            relatedType: 'Provider',
          },
        });
      }
    });

    return { message: 'Vetting badge revoked' };
  }

  async getFlags(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.contentFlag.findMany({
        where: { status: FlagStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          reporter: { select: { name: true, email: true } },
        },
      }),
      this.prisma.contentFlag.count({ where: { status: FlagStatus.PENDING } }),
    ]);
    return { data, meta: { page, pageSize, total } };
  }

  async resolveFlag(flagId: string, action: string, adminId: string) {
    const allowedActions = ['REMOVE', 'DISMISS'];
    if (!allowedActions.includes(action)) {
      throw new BadRequestException(`Invalid action. Must be one of: ${allowedActions.join(', ')}`);
    }

    const flag = await this.prisma.contentFlag.findUnique({
      where: { id: flagId },
    });
    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    if (action === 'REMOVE' && flag.targetType === FlagTarget.REVIEW) {
      await this.prisma.review.update({
        where: { id: flag.targetId },
        data: { isVisible: false },
      });
    }

    await this.prisma.contentFlag.update({
      where: { id: flagId },
      data: {
        status: action === 'REMOVE' ? FlagStatus.REMOVED : FlagStatus.DISMISSED,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    return { message: `Flag ${action === 'REMOVE' ? 'resolved and content removed' : 'dismissed'}` };
  }

  async suspendUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.prisma.provider.updateMany({
      where: { userId },
      data: { isAvailable: false },
    });

    // Notify the user about account suspension
    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.ACCOUNT_SUSPENDED,
        message: 'Your account has been suspended. Please contact support for more information.',
        relatedId: userId,
        relatedType: 'User',
      },
    });

    this.logger.log(`User ${userId} suspended`);
    return { message: 'User suspended' };
  }

  async getUsers(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { data, meta: { page, pageSize, total } };
  }

  async getTransactions(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          consumer: { select: { name: true } },
          provider: {
            select: {
              tradeCategory: true,
              slug: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.transaction.count(),
    ]);
    return { data, meta: { page, pageSize, total } };
  }

  async getProviders(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.provider.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          tradeCategory: true,
          location: true,
          bio: true,
          portfolioUrls: true,
          documentUrls: true,
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
        },
      }),
      this.prisma.provider.count(),
    ]);
    return { data, meta: { page, pageSize, total } };
  }

  async getDashboard() {
    const [totalUsers, activeProviders, totalInquiries, totalTransactions, platformRevenue, pendingVetting, pendingFlags] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.provider.count({
          where: {
            onboardingState: { in: [OnboardingState.ACTIVE, OnboardingState.VERIFIED] },
            user: { isActive: true },
          },
        }),
        this.prisma.inquiry.count({
          where: {
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        }),
        this.prisma.transaction.count({
          where: {
            status: 'SUCCESSFUL',
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        }),
        this.prisma.payout.aggregate({
          _sum: { platformFee: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        }),
        this.prisma.provider.count({
          where: {
            onboardingState: OnboardingState.ACTIVE,
            isVerified: false,
          },
        }),
        this.prisma.contentFlag.count({
          where: { status: FlagStatus.PENDING },
        }),
      ]);

    return {
      totalUsers,
      activeProviders,
      totalInquiries,
      totalTransactions,
      platformRevenue: platformRevenue._sum.platformFee || 0,
      pendingVetting,
      pendingFlags,
    };
  }

  async getChartData() {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = start.toLocaleDateString('en-GB', { month: 'short' });
      months.push({ label, start, end });
    }

    const revenueData = await Promise.all(
      months.map(async (m) => {
        const result = await this.prisma.payout.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: m.start, lte: m.end },
          },
        });
        return { month: m.label, revenue: result._sum.amount || 0 };
      }),
    );

    const signupData = await Promise.all(
      months.map(async (m) => {
        const [consumers, providers] = await Promise.all([
          this.prisma.user.count({
            where: { role: 'CONSUMER', createdAt: { gte: m.start, lte: m.end } },
          }),
          this.prisma.user.count({
            where: { role: 'PROVIDER', createdAt: { gte: m.start, lte: m.end } },
          }),
        ]);
        return { month: m.label, consumers, providers };
      }),
    );

    return { revenue: revenueData, signups: signupData };
  }
}
