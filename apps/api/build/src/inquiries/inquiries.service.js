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
exports.InquiriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const constants_1 = require("../common/config/constants");
const client_1 = require("@prisma/client");
let InquiriesService = class InquiriesService {
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
        const recentInquiry = await this.prisma.inquiry.findFirst({
            where: {
                consumerId,
                providerId: dto.providerId,
                createdAt: {
                    gte: new Date(Date.now() - constants_1.INQUIRY_DEDUP_WINDOW_MINUTES * 60 * 1000),
                },
            },
        });
        if (recentInquiry) {
            throw new common_1.BadRequestException('You have already messaged this provider recently');
        }
        const inquiry = await this.prisma.inquiry.create({
            data: {
                consumerId,
                providerId: dto.providerId,
                message: dto.message.trim(),
            },
            select: {
                id: true,
                message: true,
                status: true,
                createdAt: true,
            },
        });
        await this.prisma.notification.create({
            data: {
                userId: provider.userId,
                type: 'INQUIRY_RECEIVED',
                message: 'You have received a new inquiry from a customer.',
                relatedId: inquiry.id,
                relatedType: 'Inquiry',
            },
        });
        return inquiry;
    }
    async findOne(id, userId, role) {
        const inquiry = await this.prisma.inquiry.findUnique({
            where: { id },
            include: {
                consumer: { select: { id: true, name: true } },
                provider: { select: { id: true, userId: true, tradeCategory: true } },
            },
        });
        if (!inquiry) {
            throw new common_1.NotFoundException('Inquiry not found');
        }
        if (role !== client_1.Role.ADMIN &&
            inquiry.consumer.id !== userId &&
            inquiry.provider.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this inquiry');
        }
        return inquiry;
    }
    async findForUser(userId, role) {
        if (role === client_1.Role.PROVIDER) {
            const provider = await this.prisma.provider.findUnique({
                where: { userId },
                select: { id: true },
            });
            if (!provider)
                return [];
            return this.prisma.inquiry.findMany({
                where: { providerId: provider.id },
                orderBy: { createdAt: 'desc' },
                include: {
                    consumer: { select: { id: true, name: true, avatarUrl: true } },
                },
            });
        }
        return this.prisma.inquiry.findMany({
            where: { consumerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                provider: {
                    select: {
                        id: true,
                        slug: true,
                        tradeCategory: true,
                        location: true,
                        user: { select: { name: true, avatarUrl: true } },
                    },
                },
            },
        });
    }
    async updateStatus(id, userId, dto) {
        const inquiry = await this.prisma.inquiry.findUnique({
            where: { id },
            include: { provider: { select: { userId: true } } },
        });
        if (!inquiry) {
            throw new common_1.NotFoundException('Inquiry not found');
        }
        if (inquiry.provider.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own inquiries');
        }
        const updated = await this.prisma.inquiry.update({
            where: { id },
            data: { status: dto.status },
            select: { id: true, status: true, updatedAt: true },
        });
        if (dto.status === 'RESPONDED') {
            await this.prisma.notification.create({
                data: {
                    userId: inquiry.consumerId,
                    type: 'INQUIRY_REPLIED',
                    message: 'A provider has responded to your inquiry.',
                    relatedId: id,
                    relatedType: 'Inquiry',
                },
            });
        }
        return updated;
    }
};
exports.InquiriesService = InquiriesService;
exports.InquiriesService = InquiriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InquiriesService);
//# sourceMappingURL=inquiries.service.js.map