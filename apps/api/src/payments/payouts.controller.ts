import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { ProviderBankDetailsDto } from './dto/payments.dto';
import { Role } from '@prisma/client';

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('provider-details')
  @Roles(Role.PROVIDER)
  @HttpCode(HttpStatus.OK)
  async submitBankDetails(
    @CurrentUser() user: { userId: string },
    @Body() dto: ProviderBankDetailsDto,
  ) {
    return this.paymentsService.saveBankDetails(user.userId, dto);
  }

  @Get('provider-details')
  @Roles(Role.PROVIDER)
  async getBankDetails(@CurrentUser() user: { userId: string }) {
    return this.paymentsService.getBankDetails(user.userId);
  }
}
