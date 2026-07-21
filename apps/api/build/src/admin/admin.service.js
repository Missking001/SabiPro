"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = AdminService_1 = class AdminService {
    prisma;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async approveVetting(providerId, badgeType, adminId) {
        const provider = await this.prisma.provider.findUnique({
            where: { id: providerId },
            include: { vettingBadge: true },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        if (provider.vettingBadge) {
            throw new common_1.ConflictException('Provider already has a vetting badge');
        }
        const badge = await this.prisma.$transaction(async (tx) => {
            const b = await tx.vettingBadge.create({
                data: {
                    providerId,
                    badgeType: badgeType,
                    issuedBy: adminId,
                },
            });
            await tx.provider.update({
                where: { id: providerId },
                data: {
                    isVerified: true,
                    onboardingState: client_1.OnboardingState.VERIFIED,
                },
            });
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
    async revokeBadge(providerId) {
        const badge = await this.prisma.vettingBadge.findUnique({
            where: { providerId },
        });
        if (!badge) {
            throw new common_1.NotFoundException('No vetting badge found for this provider');
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
                    onboardingState: client_1.OnboardingState.ACTIVE,
                },
            });
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
            where: { status: client_1.FlagStatus.PENDING },
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { name: true, email: true } },
            },
        });
    }
    async resolveFlag(flagId, action, adminId) {
        const flag = await this.prisma.contentFlag.findUnique({
            where: { id: flagId },
        });
        if (!flag) {
            throw new common_1.NotFoundException('Flag not found');
        }
        if (action === 'REMOVE' && flag.targetType === client_1.FlagTarget.REVIEW) {
            await this.prisma.review.update({
                where: { id: flag.targetId },
                data: { isVisible: false },
            });
        }
        await this.prisma.contentFlag.update({
            where: { id: flagId },
            data: {
                status: action === 'REMOVE' ? client_1.FlagStatus.REMOVED : client_1.FlagStatus.DISMISSED,
                resolvedBy: adminId,
                resolvedAt: new Date(),
            },
        });
        return { message: `Flag ${action === 'REMOVE' ? 'resolved and content removed' : 'dismissed'}` };
    }
    async suspendUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
        await this.prisma.provider.updateMany({
            where: { userId },
            data: { isAvailable: false },
        });
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
        const [totalUsers, activeProviders, totalInquiries, totalTransactions, platformRevenue, pendingVetting, pendingFlags] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.provider.count({
                where: {
                    onboardingState: { in: [client_1.OnboardingState.ACTIVE, client_1.OnboardingState.VERIFIED] },
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
                    onboardingState: client_1.OnboardingState.ACTIVE,
                    isVerified: false,
                },
            }),
            this.prisma.contentFlag.count({
                where: { status: client_1.FlagStatus.PENDING },
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map