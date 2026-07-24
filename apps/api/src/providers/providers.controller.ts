import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateProviderDto, UpdateProviderDto, SearchProvidersDto } from './dto/providers.dto';
import { Role } from '@prisma/client';

@Controller('api/providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  async search(@Query() dto: SearchProvidersDto) {
    return this.providersService.search(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.providersService.findByUser(user.userId);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.providersService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.ADMIN)
  async create(
    @Body() dto: CreateProviderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.providersService.create(user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.providersService.update(id, user.userId, user.role, dto);
  }

  @Post('switch-to-consumer')
  @UseGuards(JwtAuthGuard)
  async switchToConsumer(@CurrentUser() user: AuthenticatedUser) {
    return this.providersService.switchToConsumer(user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.ADMIN)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.providersService.deactivate(id, user.userId, user.role);
  }
}
