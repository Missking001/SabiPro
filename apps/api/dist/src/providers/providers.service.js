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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const constants_1 = require("../common/config/constants");
const client_1 = require("@prisma/client");
let ProvidersService = class ProvidersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(dto) {
        const page = dto.page || 1;
        const pageSize = dto.pageSize || constants_1.DEFAULT_PAGE_SIZE;
        const skip = (page - 1) * pageSize;
        const where = {
            onboardingState: { in: [client_1.OnboardingState.ACTIVE, client_1.OnboardingState.VERIFIED] },
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
                    priceRange: true,
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
    async findBySlug(slug) {
        const provider = await this.prisma.provider.findUnique({
            where: { slug },
            select: {
                id: true,
                slug: true,
                tradeCategory: true,
                location: true,
                bio: true,
                portfolioUrls: true,
                priceRange: true,
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
            throw new common_1.NotFoundException('Provider not found');
        }
        if (provider.onboardingState === client_1.OnboardingState.REGISTERED || provider.onboardingState === client_1.OnboardingState.PROFILE_COMPLETE) {
            throw new common_1.NotFoundException('This profile is no longer available');
        }
        return provider;
    }
    async create(userId, dto) {
        const existing = await this.prisma.provider.findUnique({ where: { userId } });
        if (existing) {
            throw new common_1.ConflictException('You already have a provider profile');
        }
        const slug = this.generateSlug(dto.tradeCategory, dto.location, userId);
        const provider = await this.prisma.provider.create({
            data: {
                userId,
                slug,
                bio: dto.bio,
                tradeCategory: dto.tradeCategory.trim(),
                location: dto.location.trim(),
                priceRange: dto.priceRange,
                onboardingState: client_1.OnboardingState.PROFILE_COMPLETE,
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
            data: { role: client_1.Role.PROVIDER },
        });
        return provider;
    }
    async update(id, userId, role, dto) {
        const provider = await this.prisma.provider.findUnique({ where: { id } });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        if (role !== client_1.Role.ADMIN && provider.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        const data = {};
        if (dto.bio !== undefined)
            data.bio = dto.bio;
        if (dto.tradeCategory !== undefined)
            data.tradeCategory = dto.tradeCategory.trim();
        if (dto.location !== undefined)
            data.location = dto.location.trim();
        if (dto.priceRange !== undefined)
            data.priceRange = dto.priceRange;
        if (dto.isAvailable !== undefined)
            data.isAvailable = dto.isAvailable;
        if (dto.portfolioUrls !== undefined)
            data.portfolioUrls = dto.portfolioUrls;
        if (!provider.bio && dto.bio) {
            data.onboardingState = client_1.OnboardingState.PROFILE_COMPLETE;
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
                priceRange: true,
                isAvailable: true,
                onboardingState: true,
            },
        });
    }
    async findByUser(userId) {
        const provider = await this.prisma.provider.findUnique({
            where: { userId },
            select: {
                id: true,
                slug: true,
                tradeCategory: true,
                location: true,
                bio: true,
                portfolioUrls: true,
                priceRange: true,
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
        return provider;
    }
    async deactivate(id, userId, role) {
        const provider = await this.prisma.provider.findUnique({ where: { id } });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        if (role !== client_1.Role.ADMIN && provider.userId !== userId) {
            throw new common_1.ForbiddenException('You can only deactivate your own profile');
        }
        return this.prisma.provider.update({
            where: { id },
            data: { isAvailable: false },
            select: { id: true, isAvailable: true },
        });
    }
    generateSlug(tradeCategory, location, userId) {
        const trade = tradeCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const loc = location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const suffix = userId.slice(-6);
        return `${trade}-${loc}-${suffix}`;
    }
};
exports.ProvidersService = ProvidersService;
exports.ProvidersService = ProvidersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProvidersService);
//# sourceMappingURL=providers.service.js.map