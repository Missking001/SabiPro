import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateInquiryDto, UpdateInquiryStatusDto } from './dto/inquiries.dto';
import { Role } from '@prisma/client';

@Controller('api/inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.inquiriesService.findForUser(user.userId, user.role);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSUMER)
  async create(
    @Body() dto: CreateInquiryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.create(user.userId, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inquiriesService.updateStatus(id, user.userId, dto);
  }
}
