import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('vetting/:id/approve')
  async approveVetting(
    @Param('id') id: string,
    @Body('badgeType') badgeType: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.approveVetting(id, badgeType || 'IDENTITY', user.userId);
  }

  @Post('vetting/:id/revoke')
  async revokeBadge(@Param('id') id: string) {
    return this.adminService.revokeBadge(id);
  }

  @Get('flags')
  async getFlags() {
    return this.adminService.getFlags();
  }

  @Patch('flags/:id/resolve')
  async resolveFlag(
    @Param('id') id: string,
    @Body('action') action: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.resolveFlag(id, action || 'DISMISS', user.userId);
  }

  @Patch('users/:id/suspend')
  async suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('transactions')
  async getTransactions() {
    return this.adminService.getTransactions();
  }

  @Get('providers')
  async getProviders() {
    return this.adminService.getProviders();
  }

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }
}
