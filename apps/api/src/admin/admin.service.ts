import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType, OnboardingState, FlagStatus, FlagTarget } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async approveVetting(providerId: string, badgeType: string, adminId: string) {
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
          type: 'BADGE_ISSUED',
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
            type: 'BADGE_REVOKED',
            message: 'Your vetting badge has been revoked. Your profile is still active.',
            relatedId: providerId,
            relatedType: 'Provider',
          },
        });
      }
    });

    return { message: 'Vetting badge revoked' };
  }

  async getFlags() {
    return this.prisma.contentFlag.findMany({
      where: { status: FlagStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { name: true, email: true } },
      },
    });
  }

  async resolveFlag(flagId: string, action: string, adminId: string) {
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
        type: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact support for more information.',
        relatedId: userId,
        relatedType: 'User',
      },
    });

    this.logger.log(`User ${userId} suspended`);
    return { message: 'User suspended' };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async getTransactions() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });
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
}
