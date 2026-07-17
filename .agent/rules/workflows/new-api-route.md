---
trigger: always_on
---

# workflows/new-api-route.md — New API Route Workflow

> Follow this workflow in order every time you create a new
> API route in the SabiPro NestJS backend.
> Do not skip steps.

---

## Trigger

Use this workflow when:
- Asked to add a new endpoint to the API
- Creating a new NestJS module
- Adding admin-only routes
- Adding a payment or webhook route

---

## Step 1 — Read Context Files

Before writing any code, read:

```
.agent/rules/architecture.md           ← service structure, module layout
.agent/rules/code-style.md             ← TypeScript rules, NestJS patterns
.agent/rules/security.md               ← auth, RBAC, validation, rate limiting
skills/api-route-scaffolder/SKILL.md    ← controller/service/DTO templates
```

If the route is payment-related, also read:
```
skills/flutterwave-integration/SKILL.md
skills/flutterwave-integration/resources/webhook-handler.ts
```

If the route involves a new model or schema change, also read:
```
skills/db-migration-runner/SKILL.md
```

---

## Step 2 — Define the Route

Write out the route spec before touching any code:

```
Method:      POST
Path:        /api/inquiries
Auth:        Required (CONSUMER only)
Rate limit:  5 per minute
Body:        { providerId: string, message: string }
Response:    201 { success: true, data: Inquiry }
Side effect: Creates Notification for provider
             Triggers INQUIRY_RECEIVED email if FEATURE_NOTIFICATIONS is on
```

---

## Step 3 — Check Feature Flag

If the feature is behind a flag, wrap the logic:

```typescript
import { featureFlags } from '../common/config/feature-flags';

if (!featureFlags.FEATURE_INQUIRY_SYSTEM) {
  throw new ServiceUnavailableException('This feature is not available');
}
```

---

## Step 4 — Create the DTO

```typescript
// apps/api/src/inquiries/dto/create-inquiry.dto.ts
import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  message: string;
}
```

---

## Step 5 — Add the Controller Method

```typescript
// In inquiries.controller.ts
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CONSUMER)
@HttpCode(HttpStatus.CREATED)
async create(@Req() req, @Body() dto: CreateInquiryDto) {
  return this.inquiriesService.create(req.user.sub, dto);
}
```

---

## Step 6 — Implement the Service Method

Follow this structure for every service method:

```typescript
async create(consumerId: string, dto: CreateInquiryDto) {
  // 1. Check feature flag
  // 2. Validate business rules (deduplication, rate limits, etc.)
  // 3. Verify related entities exist
  // 4. Check permissions / ownership
  // 5. Write to database (use transaction if multiple writes)
  // 6. Trigger side effects (notifications, emails)
  // 7. Return response

  // 1. Feature flag
  if (!featureFlags.FEATURE_INQUIRY_SYSTEM) {
    throw new ServiceUnavailableException('Inquiry system is not available');
  }

  // 2. Deduplication — block second inquiry within 10 minutes
  const windowStart = new Date(Date.now() - INQUIRY_DEDUP_WINDOW_MINUTES * 60 * 1000);
  const recentInquiry = await this.prisma.inquiry.findFirst({
    where: {
      consumerId,
      providerId: dto.providerId,
      createdAt: { gte: windowStart },
    },
  });

  if (recentInquiry) {
    throw new ConflictException('You have already messaged this provider recently');
  }

  // 3. Verify provider exists and is active
  const provider = await this.prisma.provider.findUnique({
    where: { id: dto.providerId },
    include: { user: { select: { id: true } } },
  });

  if (!provider || !['ACTIVE', 'VERIFIED'].includes(provider.onboardingState)) {
    throw new NotFoundException('Provider not found');
  }

  // 5. Create inquiry
  const inquiry = await this.prisma.inquiry.create({
    data: {
      consumerId,
      providerId: dto.providerId,
      message: dto.message,
      status: InquiryStatus.PENDING,
    },
  });

  // 6. Notify provider
  await this.notifications.create({
    userId: provider.user.id,
    type: NotificationType.INQUIRY_RECEIVED,
    message: 'You have received a new inquiry.',
    relatedId: inquiry.id,
    relatedType: 'Inquiry',
    sendEmail: true,
  });

  this.logger.log(`Inquiry created: ${inquiry.id} consumer=${consumerId}`);

  // 7. Return
  return { success: true, data: inquiry };
}
```

---

## Step 7 — Security Checklist

- [ ] Auth guard applied (`@UseGuards(JwtAuthGuard)`)
- [ ] Role guard applied for role-restricted routes (`@UseGuards(RolesGuard)` + `@Roles(...)`)
- [ ] Ownership verified where user accesses their own data
- [ ] DTO uses class-validator — all inputs validated
- [ ] `ValidationPipe` is global (set in `main.ts` with `whitelist: true`)
- [ ] Rate limiting applied for sensitive endpoints
- [ ] Sensitive fields excluded from Prisma `select`
- [ ] Error messages do not leak internal details
- [ ] Webhook routes: FLW-Signature verified before processing

---

## Step 8 — Response Envelope

Every successful response must use this shape:

```typescript
// Single item
return { success: true, data: item };

// List with pagination
return {
  success: true,
  data: items,
  meta: { page, pageSize: DEFAULT_PAGE_SIZE, total },
};

// No content (DELETE, deactivate)
// Use @HttpCode(HttpStatus.NO_CONTENT) and return void
```

---

## Step 9 — If a Schema Change Is Needed

```
1. Edit apps/api/prisma/schema.prisma
2. Run: npx prisma migrate dev --name describe_change
3. Run: npx prisma generate
4. Commit schema.prisma + prisma/migrations/ together
5. See skills/db-migration-runner/SKILL.md for full guidance
```

---

## Step 10 — Register in AppModule

If you created a new module, add it to `app.module.ts`:

```typescript
@Module({
  imports: [
    // existing modules...
    InquiriesModule,   // ← add here
  ],
})
export class AppModule {}
```

---

## Step 11 — Done Criteria

The route is complete when:

- [ ] DTO defined and validated
- [ ] Controller method added with correct decorators
- [ ] Service method follows the 7-step structure
- [ ] Feature flag checked if applicable
- [ ] Auth and RBAC guards applied
- [ ] Ownership check in place where required
- [ ] Sensitive fields excluded from responses
- [ ] Side effects (notifications, emails) triggered
- [ ] Logged with `this.logger` — not `console.log`
- [ ] HTTP status code is semantically correct
- [ ] Response uses the standard envelope
- [ ] Module registered in `AppModule` if new
- [ ] Schema migrated and committed if schema changed

---

## HTTP Status Code Reference

| Scenario | Code |
|----------|------|
| Successful GET or action | 200 |
| Successful creation | 201 |
| Successful DELETE / no content | 204 |
| Validation error | 400 |
| Not authenticated | 401 |
| Not permitted (RBAC / ownership) | 403 |
| Resource not found | 404 |
| Duplicate / conflict | 409 |
| Unprocessable (business rule violation) | 422 |
| Internal error | 500 |

---

## Common Mistakes to Avoid

```
✗ Business logic in the controller
✗ Missing DTO — never accept raw @Body() without a typed DTO
✗ Missing auth guard on protected route
✗ Missing ownership check
✗ Returning full Prisma objects — always use select
✗ Using console.log — use this.logger
✗ Forgetting to register new module in AppModule
✗ Schema change without running migration
✗ Forgetting idempotency check on webhook routes
✗ Trusting role from request body — always use req.user from JWT
✗ Processing Flutterwave webhook without verifying FLW-Signature
```