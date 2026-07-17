import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto, UpdateInquiryStatusDto } from './dto/inquiries.dto';
import { INQUIRY_DEDUP_WINDOW_MINUTES } from '../common/config/constants';
import { Role } from '@prisma/client';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(consumerId: string, dto: CreateInquiryDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
      select: { id: true, userId: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const recentInquiry = await this.prisma.inquiry.findFirst({
      where: {
        consumerId,
        providerId: dto.providerId,
        createdAt: {
          gte: new Date(Date.now() - INQUIRY_DEDUP_WINDOW_MINUTES * 60 * 1000),
        },
      },
    });
    if (recentInquiry) {
      throw new BadRequestException('You have already messaged this provider recently');
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

    // Notify the provider about the new inquiry
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

  async findOne(id: string, userId: string, role: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        consumer: { select: { id: true, name: true } },
        provider: { select: { id: true, userId: true, tradeCategory: true } },
      },
    });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    if (
      role !== Role.ADMIN &&
      inquiry.consumer.id !== userId &&
      inquiry.provider.userId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this inquiry');
    }

    return inquiry;
  }

  async findForUser(userId: string, role: string) {
    // Providers see inquiries sent TO them; consumers see inquiries they sent
    if (role === Role.PROVIDER) {
      const provider = await this.prisma.provider.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!provider) return [];
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

  async updateStatus(id: string, userId: string, dto: UpdateInquiryStatusDto) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: { provider: { select: { userId: true } } },
    });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    if (inquiry.provider.userId !== userId) {
      throw new ForbiddenException('You can only update your own inquiries');
    }

    const updated = await this.prisma.inquiry.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, status: true, updatedAt: true },
    });

    // Notify the consumer when the provider responds to their inquiry
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
}
