import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
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

  @Post('providers/:id/approve')
  async approveProvider(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.approveProvider(id, user.userId);
  }

  @Post('vetting/:id/revoke')
  async revokeBadge(@Param('id') id: string) {
    return this.adminService.revokeBadge(id);
  }

  @Get('flags')
  async getFlags(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.adminService.getFlags(page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 20);
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
  async getUsers(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.adminService.getUsers(page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 20);
  }

  @Get('transactions')
  async getTransactions(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.adminService.getTransactions(page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 20);
  }

  @Get('providers')
  async getProviders(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.adminService.getProviders(page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 20);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('charts')
  async getChartData() {
    return this.adminService.getChartData();
  }
}
