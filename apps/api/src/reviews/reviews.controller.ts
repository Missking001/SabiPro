import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto, FlagReviewDto } from './dto/reviews.dto';
import { Role } from '@prisma/client';

@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSUMER)
  async create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.create(user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }

  @Post(':id/flag')
  @UseGuards(JwtAuthGuard)
  async flag(
    @Param('id') id: string,
    @Body() dto: FlagReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.flag(id, user.userId, dto);
  }

  @Get('provider/:providerId')
  async getProviderReviews(@Param('providerId') providerId: string) {
    return this.reviewsService.getProviderReviews(providerId);
  }
}
