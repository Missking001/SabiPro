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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(consumerId, dto) {
        const provider = await this.prisma.provider.findUnique({
            where: { id: dto.providerId },
            select: { id: true, userId: true },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        const existing = await this.prisma.review.findUnique({
            where: { consumerId_providerId: { consumerId, providerId: dto.providerId } },
        });
        if (existing) {
            throw new common_1.ConflictException('You have already reviewed this provider');
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
    async remove(id) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
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
    async flag(id, userId, dto) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
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
    async getProviderReviews(providerId) {
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
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map