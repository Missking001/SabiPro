import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { InitiatePaymentDto } from './dto/payments.dto';
import { Role } from '@prisma/client';

@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSUMER)
  async initiate(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.initiate(user.userId, dto);
  }

  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('flw-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(body, signature);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.findOne(id, user.userId, user.role);
  }

  @Get('consumer/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSUMER)
  async consumerHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getConsumerHistory(user.userId);
  }

  @Get('provider/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  async providerHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getProviderHistory(user.userId);
  }

  @Post(':id/release')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSUMER, Role.ADMIN)
  async releasePayout(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.releasePayout(id, user.userId, user.role);
  }

  @Post(':id/dispute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSUMER)
  async dispute(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.dispute(id, user.userId);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async refund(@Param('id') id: string) {
    return this.paymentsService.refund(id);
  }
}
