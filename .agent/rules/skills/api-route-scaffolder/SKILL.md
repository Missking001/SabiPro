---
trigger: always_on
---

# SKILL.md — API Route Scaffolder

> Use this skill whenever you are creating a new NestJS API route
> in the SabiPro backend. Follow every step in order.

---

## When to Use This Skill

- Adding a new endpoint to an existing NestJS module
- Creating an entirely new module with its own routes
- Adding a new admin route

---

## Step 1 — Identify the Module

Every route belongs to a module. Check `apps/api/src/` first:

```
auth/           → register, login, logout, verify-email, reset-password
providers/      → CRUD, search, onboarding
reviews/        → submit, flag, moderate
inquiries/      → send, status update
notifications/  → list, mark-read
payments/       → initiate, webhook, release, dispute, refund
admin/          → vetting, flags, suspend
```

If no existing module fits → create a new one (Step 2B).

---

## Step 2A — Adding to an Existing Module

Add the method to the existing controller and service.
No new files needed unless the logic is substantial enough for a sub-service.

---

## Step 2B — Creating a New Module

Scaffold in this order:

```bash
# 1. Create the module folder
mkdir apps/api/src/[module-name]

# 2. Create the four required files
touch apps/api/src/[module-name]/[module-name].module.ts
touch apps/api/src/[module-name]/[module-name].controller.ts
touch apps/api/src/[module-name]/[module-name].service.ts
mkdir apps/api/src/[module-name]/dto

# 3. Register in AppModule
# Add to imports: array in apps/api/src/app.module.ts
```

---

## Step 3 — Module Template (Providers Reference Example)

> [!IMPORTANT]
> The templates in Steps 3 through 6 use the **`providers`** module as a concrete reference example. 
> When scaffolding your new module, replace all occurrences of `providers` / `Providers` / `Provider` with your target module name (e.g., `inquiries`, `reviews`), and adapt the fields and DTOs to fit your data models.

```typescript
// apps/api/src/[module-name]/[module-name].module.ts
import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
```

---

## Step 4 — Controller Template (Providers Reference Example)

```typescript
// apps/api/src/providers/providers.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Req,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // Public — no auth required
  @Get()
  async search(@Query() query: SearchProvidersDto) {
    return this.providersService.search(query);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.providersService.findBySlug(slug);
  }

  // Protected — provider or admin only
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() dto: CreateProviderDto) {
    return this.providersService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.ADMIN)
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providersService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Req() req, @Param('id') id: string) {
    return this.providersService.deactivate(req.user.sub, id);
  }
}
```

---

## Step 5 — Service Template (Providers Reference Example)

```typescript
// apps/api/src/providers/providers.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { DEFAULT_PAGE_SIZE } from '../common/config/constants';

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchProvidersDto) {
    const {
      tradeCategory,
      location,
      isVerified,
      isAvailable,
      minRating,
      page = 1,
      sortBy = 'averageRating',
    } = query;

    const where = {
      onboardingState: { in: ['ACTIVE', 'VERIFIED'] as const },
      ...(tradeCategory && {
        tradeCategory: { equals: tradeCategory, mode: 'insensitive' as const },
      }),
      ...(location && {
        location: { contains: location, mode: 'insensitive' as const },
      }),
      ...(isVerified !== undefined && { isVerified }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(minRating && { averageRating: { gte: minRating } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.provider.findMany({
        where,
        skip: (page - 1) * DEFAULT_PAGE_SIZE,
        take: DEFAULT_PAGE_SIZE,
        orderBy: { [sortBy]: 'desc' },
        select: {
          id: true,
          slug: true,
          tradeCategory: true,
          location: true,
          priceRange: true,
          isAvailable: true,
          isVerified: true,
          averageRating: true,
          totalReviews: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return {
      success: true,
      data,
      meta: { page, pageSize: DEFAULT_PAGE_SIZE, total },
    };
  }

  async findBySlug(slug: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        bio: true,
        tradeCategory: true,
        location: true,
        portfolioUrls: true,
        priceRange: true,
        isAvailable: true,
        isVerified: true,
        averageRating: true,
        totalReviews: true,
        onboardingState: true,
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    if (!provider || !['ACTIVE', 'VERIFIED'].includes(provider.onboardingState)) {
      throw new NotFoundException('Provider not found');
    }

    return { success: true, data: provider };
  }

  async create(userId: string, dto: CreateProviderDto) {
    // Check user doesn't already have a provider profile
    const existing = await this.prisma.provider.findUnique({
      where: { userId },
    });
    if (existing) throw new ConflictException('Provider profile already exists');

    const slug = generateSlug(dto.tradeCategory, dto.location, userId);

    const provider = await this.prisma.provider.create({
      data: { userId, slug, ...dto },
    });

    this.logger.log(`Provider profile created: ${provider.id}`);
    return { success: true, data: provider };
  }

  async update(userId: string, providerId: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) throw new NotFoundException('Provider not found');

    // Ownership check — provider can only update their own profile
    if (provider.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.provider.update({
      where: { id: providerId },
      data: dto,
    });

    return { success: true, data: updated };
  }

  async deactivate(userId: string, providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userId !== userId) throw new ForbiddenException();

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(tradeCategory: string, location: string, userId: string): string {
  const base = `${tradeCategory}-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  const suffix = userId.slice(-6);
  return `${base}-${suffix}`;
}
```

---

## Step 6 — DTO Templates (Providers Reference Example)

```typescript
// dto/create-provider.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  tradeCategory: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  location: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @IsString()
  @IsOptional()
  priceRange?: string;
}

// dto/search-providers.dto.ts
import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchProvidersDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  tradeCategory?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  location?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsIn(['averageRating', 'createdAt', 'totalReviews'])
  sortBy?: string;
}
```

---

## Step 7 — Response Envelope

The global `ResponseInterceptor` wraps all responses automatically.
In services, return the data directly — the interceptor handles wrapping.

```typescript
// For successful responses, return data directly from the service:
return provider; // interceptor wraps to { success: true, data: provider }

// For errors, throw NestJS exceptions — the exception filter handles formatting:
throw new NotFoundException('Provider not found');
// → { success: false, error: { code: 'NOT_FOUND', message: 'Provider not found' } }
```

---

## Step 8 — Route Checklist

Before marking a route complete, verify:

- [ ] DTO exists and uses class-validator decorators
- [ ] Auth guard applied where required (`JwtAuthGuard`)
- [ ] Role guard applied where required (`RolesGuard` + `@Roles()`)
- [ ] Ownership check where user should only access their own data
- [ ] Prisma `select` used — no full objects returned blindly
- [ ] Sensitive fields excluded from response (password, phone, email)
- [ ] Error handled with correct NestJS exception class
- [ ] Rate limiting applied for sensitive endpoints
- [ ] Logged with `this.logger` — not `console.log`
- [ ] HTTP status code is semantically correct

---

## Common Mistakes to Avoid

```
✗ Business logic in the controller — belongs in the service
✗ Missing ownership check on user-scoped resources
✗ Returning full Prisma objects — always use select
✗ Using console.log — use this.logger
✗ Missing auth guard on a protected route
✗ Missing DTO validation — all body inputs must use a DTO
✗ Throwing raw Error — use NestJS exception classes
✗ Trusting role from request body — always decode from JWT via req.user
```