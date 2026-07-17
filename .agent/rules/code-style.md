---
trigger: always_on
---

# code-style.md — SabiPro Code Style Rules

> These rules apply to every file in the codebase — frontend and backend.
> The agent must follow them without exception unless explicitly instructed otherwise.

---

## Language and Tooling

- TypeScript everywhere — no plain `.js` files in `apps/`
- Strict mode enabled in `tsconfig.json` (`"strict": true`)
- ESLint + Prettier for formatting — do not bypass with `// eslint-disable`
- Path aliases configured — use `@/` for frontend imports, not relative `../../`

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files — components | PascalCase | `ProviderCard.tsx` |
| Files — utilities | camelCase | `formatRating.ts` |
| Files — hooks | camelCase, `use` prefix | `useProviders.ts` |
| Files — NestJS modules | kebab-case | `providers.service.ts` |
| React components | PascalCase | `ProviderCard` |
| Functions | camelCase | `getProviderBySlug` |
| Variables | camelCase | `averageRating` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PORTFOLIO_IMAGES` |
| Enums | PascalCase | `InquiryStatus` |
| Enum values | SCREAMING_SNAKE_CASE | `InquiryStatus.PENDING` |
| Interfaces | PascalCase, `I` prefix optional | `ProviderProfile` or `IProviderProfile` |
| Types | PascalCase | `SearchFilters` |
| Database fields | camelCase | `averageRating`, `isVerified` |
| API endpoints | kebab-case | `/api/providers/:id/vetting-badge` |
| CSS classes (Tailwind) | utility classes only — no custom class names |
| Environment variables | SCREAMING_SNAKE_CASE | `JWT_SECRET` |
| Feature flags | `FEATURE_` prefix | `FEATURE_PAYMENT_SYSTEM` |

---

## TypeScript Rules

```typescript
// ✓ Always type function parameters and return values
async function getProvider(slug: string): Promise<Provider> { ... }

// ✓ Use interfaces for object shapes
interface SearchFilters {
  tradeCategory?: string;
  location?: string;
  isVerified?: boolean;
  minRating?: number;
}

// ✓ Use enums from Prisma — do not redefine them
import { InquiryStatus } from '@prisma/client';

// ✗ Never use `any`
const data: any = response; // forbidden

// ✗ Never use type assertions to bypass the type system
const user = response as User; // only acceptable when you know the shape

// ✓ Use optional chaining and nullish coalescing
const rating = provider?.averageRating ?? 0;

// ✓ Prefer readonly for data that should not be mutated
interface Config {
  readonly jwtSecret: string;
}
```

---

## React / Next.js Rules

```tsx
// ✓ Server components by default in App Router
// Mark client components explicitly
'use client';

// ✓ Use named exports for components
export function ProviderCard({ provider }: ProviderCardProps) { ... }

// ✗ No default exports for components (except page.tsx and layout.tsx)

// ✓ Props interface defined above the component
interface ProviderCardProps {
  provider: ProviderSummary;
  onInquiry?: () => void;
}

// ✓ Loading and error states always handled
if (isLoading) return <ProviderCardSkeleton />;
if (error) return <ErrorMessage message={error.message} onRetry={refetch} />;
if (!provider) return <EmptyState message="No provider found" />;

// ✓ Use next/image for all images
import Image from 'next/image';

// ✗ Never use <img> directly
<img src={url} />  // forbidden

// ✓ Use next/link for internal navigation
import Link from 'next/link';

// ✓ Server components fetch data directly — no useEffect for data fetching
// ✗ useEffect for data fetching is forbidden in server components
```

---

## NestJS Rules

```typescript
// ✓ Every controller method has a clearly typed DTO
@Post()
async create(@Body() dto: CreateProviderDto): Promise<ApiResponse<Provider>> { ... }

// ✓ DTOs use class-validator decorators
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  tradeCategory: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;
}

// ✓ Services handle business logic — controllers only route and validate
// ✗ Never put business logic in a controller

// ✓ Use constructor injection — never manual instantiation
constructor(
  private readonly prisma: PrismaService,
  private readonly notifications: NotificationsService,
) {}

// ✓ Use @Roles() decorator + RolesGuard for RBAC
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Post(':id/approve')
async approveVetting(@Param('id') id: string) { ... }

// ✓ Async/await throughout — no raw Promise chains
```

---

## Prisma Rules

```typescript
// ✓ All DB operations go through PrismaService — never raw SQL
const provider = await this.prisma.provider.findUnique({
  where: { slug },
  include: { user: { select: { name: true, avatarUrl: true } } },
});

// ✓ Use transactions for operations that must be atomic
await this.prisma.$transaction([
  this.prisma.review.create({ data: reviewData }),
  this.prisma.provider.update({
    where: { id: providerId },
    data: {
      averageRating: newAverage,
      totalReviews: { increment: 1 },
    },
  }),
]);

// ✓ Always select only the fields you need — never return full objects blindly
const user = await this.prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, role: true },
  // password, phone not selected — never returned
});

// ✗ Never use prisma db push in any environment other than initial local setup
// ✓ Always use prisma migrate dev (development) and prisma migrate deploy (production)
```

---

## Money / Payments Rules

```typescript
// ✓ Always store and calculate in kobo (integer)
const amountInKobo = 5000 * 100; // ₦5,000 = 500,000 kobo

// ✗ Never use floats for money
const amount = 5000.50; // forbidden

// ✓ Format for display only at the UI layer
function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

// ✓ Validate amount is a positive integer before any operation
if (!Number.isInteger(amount) || amount <= 0) {
  throw new BadRequestException('Invalid payment amount');
}
```

---

## Error Handling Rules

```typescript
// ✓ Use NestJS built-in exceptions — never throw raw Error
throw new NotFoundException('Provider not found');
throw new BadRequestException('Email already registered');
throw new ForbiddenException('You do not have permission to do this');
throw new UnauthorizedException('Please log in to continue');

// ✓ Catch and handle Prisma errors explicitly
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

try {
  await this.prisma.review.create({ data });
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('You have already reviewed this provider');
    }
  }
  throw error;
}

// ✓ Frontend: always handle fetch errors with user-friendly messages
// ✗ Never let errors surface as raw stack traces or blank screens
```

---

## File Upload Rules

```typescript
// ✓ Validate before upload — these constants must live in a config file
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_PORTFOLIO_IMAGES = 6;
const MAX_AVATAR_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

// ✓ Validate server-side — client validation is UX only
if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
  throw new BadRequestException('Only JPG, PNG, and WebP files are accepted');
}
if (file.size > MAX_FILE_SIZE_BYTES) {
  throw new BadRequestException('Image must be under 2MB');
}
```

---

## Constants and Configuration

```typescript
// ✓ All magic values live in a constants file — never inline
// apps/api/src/common/config/constants.ts

export const INQUIRY_DEDUP_WINDOW_MINUTES = 10;
export const PASSWORD_RESET_EXPIRY_HOURS = 1;
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
export const PAYOUT_AUTO_RELEASE_DAYS = 7;
export const MAX_LOGIN_ATTEMPTS = 5;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PORTFOLIO_IMAGES = 6;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_AVATAR_SIZE_BYTES = 1 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```

---

## Comments

```typescript
// ✓ Comment WHY, not WHAT
// Recompute rating inside a transaction to prevent race conditions
await this.prisma.$transaction([...]);

// ✗ Do not comment what the code obviously does
// Loop through reviews  ← useless
reviews.forEach(review => { ... });

// ✓ JSDoc for public service methods
/**
 * Sends an inquiry from a consumer to a provider.
 * Blocks duplicate inquiries within INQUIRY_DEDUP_WINDOW_MINUTES.
 */
async sendInquiry(consumerId: string, dto: CreateInquiryDto): Promise<Inquiry> { ... }
```

---

## Forbidden Patterns

```typescript
// ✗ No console.log in production code — use NestJS Logger
console.log('User logged in'); // forbidden
this.logger.log('User logged in'); // correct

// ✗ No any
const data: any = ...; // forbidden

// ✗ No non-null assertions unless provably safe
const user = getUser()!; // avoid

// ✗ No hardcoded secrets
const secret = 'my-jwt-secret'; // forbidden

// ✗ No raw SQL
await this.prisma.$queryRaw`SELECT * FROM users`; // forbidden unless absolutely necessary

// ✗ No floats for money
const amount = 1500.50; // forbidden

// ✗ No direct Supabase upload from frontend
supabase.storage.from('portfolio').upload(...); // frontend — forbidden

// ✗ No prisma db push in production
// prisma migrate deploy is the only production migration command
```