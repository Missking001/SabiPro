---
trigger: always_on
---

# architecture.md — SabiPro Architecture Rules

> Read this file before making any structural, infrastructure,or
> architectural decision. Every decision must be consistent with
> the two-service setup defined here.

---

## Service Map

```
┌─────────────────────────┐         HTTPS/REST        ┌──────────────────────────┐
│  Frontend               │ ─────────────────────────► │  Backend                 │
│  Next.js 14 (App Router)│ ◄───────────────────────── │  NestJS                  │
│  Tailwind CSS           │       JSON responses        │  Prisma + PostgreSQL     │
│  NextAuth.js            │                             │  Supabase Storage        │
│  Hosted: Vercel         │                             │  Nodemailer              │
└─────────────────────────┘                             │  Flutterwave             │
                                                        │  Hosted: Render          │
                                                        └──────────────────────────┘
                                                                   │
                                              ┌────────────────────┼────────────────────┐
                                              ▼                    ▼                    ▼
                                     ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
                                     │  PostgreSQL  │   │ Supabase Storage │   │ Flutterwave  │
                                     │  (Render)    │   │ (file CDN)       │   │ (payments)   │
                                     └──────────────┘   └──────────────────┘   └──────────────┘
```

---

## Deployment Targets

| Service | Platform | Notes |
|---------|----------|-------|
| Next.js frontend | Vercel | Auto-deploy from `main` on push |
| NestJS backend | Render | Free tier — spins down after 15 min inactivity |
| PostgreSQL | Render | Managed PostgreSQL instance |
| File storage | Supabase Storage | CDN delivery, 1 GB free |
| Email | Nodemailer | SMTP — use Ethereal for local dev |
| Payments | Flutterwave | Sandbox for dev, live for production |

---

## Frontend Structure — `apps/web/`

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (consumer)/
│   │   ├── search/page.tsx
│   │   └── providers/[slug]/page.tsx      ← Server component — SSR for OG tags
│   ├── (provider)/
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   └── inquiries/page.tsx
│   ├── (admin)/                           ← Active admin panel
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts    ← NextAuth.js handler
│   ├── layout.tsx
│   └── page.tsx                           ← Homepage / search entry point
├── components/
│   ├── ui/                                ← Primitives: Button, Input, Badge, etc.
│   ├── provider/                          ← ProviderCard, ProviderProfile, etc.
│   ├── search/                            ← SearchBar, FilterPanel, ResultsList
│   ├── review/                            ← ReviewCard, ReviewForm, StarRating
│   ├── inquiry/                           ← InquiryForm, InquiryList
│   ├── payment/                           ← PaymentButton, PaymentStatus
│   └── layout/                            ← Navbar, Footer, PageShell
├── lib/
│   ├── api.ts                             ← Typed fetch wrapper for backend calls
│   ├── auth.ts                            ← NextAuth.js config
│   ├── flags.ts                           ← Feature flag checks
│   └── utils.ts                           ← Formatters, validators, helpers
├── hooks/                                 ← Custom React hooks
├── types/                                 ← Shared TypeScript interfaces
└── .env.local
```

### Frontend rules
- `app/` uses App Router — no `pages/` directory
- `/providers/[slug]` must be a **server component** — SSR is required for Open Graph meta tags
- All API calls go through `lib/api.ts` — never call `fetch` directly in a component
- `NEXT_PUBLIC_*` variables only for values safe to expose to the browser
- `SUPABASE_SERVICE_ROLE_KEY` and `FLW_SECRET_KEY` must never appear in frontend code

---

## Backend Structure — `apps/api/`

```
apps/api/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   ├── providers/
│   │   ├── providers.module.ts
│   │   ├── providers.controller.ts
│   │   ├── providers.service.ts
│   │   └── dto/
│   ├── reviews/
│   ├── inquiries/
│   ├── notifications/
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── flutterwave.service.ts       ← All Flutterwave SDK calls live here
│   │   └── dto/
│   ├── admin/
│   ├── common/
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts  ← Wraps all responses in envelope
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── config/
│   │       └── feature-flags.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma                    ← Single source of truth for all models
│   └── migrations/                      ← Never edit manually
├── test/
└── .env
```

### Backend rules
- Every module follows the NestJS module pattern: `module`, `controller`, `service`, `dto`
- All Flutterwave SDK calls are isolated in `payments/flutterwave.service.ts`
- The response envelope (`{ success, data, meta }`) is applied globally via `response.interceptor.ts`
- `common/filters/http-exception.filter.ts` handles all error formatting
- Feature flags are imported from `common/config/feature-flags.ts` — never inline
- `prisma.service.ts` is the only place `PrismaClient` is instantiated

---

## Auth Architecture

```
Browser                Next.js (Vercel)           NestJS (Render)
  │                         │                           │
  │── POST /api/auth/login ─►│                           │
  │                         │── POST /api/auth/login ──►│
  │                         │                           │── validates credentials
  │                         │                           │── checks isActive + isVerified
  │                         │◄── { user object } ───────│
  │                         │── issues JWT ─────────────┤
  │◄── Set-Cookie: token ───│   (httpOnly cookie)       │
  │                         │                           │
  │── GET /api/providers ──►│                           │
  │                         │── GET /api/providers ─────►
  │                         │   Authorization: Bearer   │── JwtAuthGuard validates
  │                         │                           │── attaches req.user
  │                         │◄── { success, data } ─────│
  │◄── rendered page ───────│                           │
```

- `JWT_SECRET` must be **identical** in `apps/web/.env.local` and `apps/api/.env`
- JWT payload shape: `{ sub: userId, email, role, iat, exp }`
- Token expiry: 7 days

---

## File Upload Architecture

```
Browser ──► Next.js ──► NestJS ──► validate ──► Supabase Storage ──► URL
                                       │                                │
                                       │ (fail: cleanup, return 500)    │
                                       └────────────────────────────────┘
                                                  store URL in PostgreSQL via Prisma
```

- Frontend sends `multipart/form-data` POST to NestJS
- NestJS validates type, size, and count before any upload attempt
- On Supabase upload success — store the public URL in PostgreSQL
- On failure — catch error, do not write to DB, return 500
- Frontend never uploads directly to Supabase

---

## Payment Architecture

```
Browser ──► NestJS /api/payments/initiate
               │
               ├── create pending Transaction record
               ├── call Flutterwave payment init API
               └── return { paymentUrl } to frontend

Browser ──► Flutterwave checkout (external)

Flutterwave ──► NestJS /api/payments/webhook  (POST — no auth header)
                   │
                   ├── verify FLW-Signature header
                   ├── idempotency check on gatewayRef
                   ├── update Transaction status
                   ├── create Notification records
                   └── return 200 immediately

Browser ──► NestJS /api/payments/:id/release  (consumer confirms job done)
               │
               └── release payout to provider
```

- Webhook endpoint has **no JWT auth** — verified via `FLW-Signature` header hash
- Always return `200` to Flutterwave webhook immediately — process async if needed
- Payout auto-releases after 7 days if consumer does not confirm

---

## CORS Configuration

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGIN,   // e.g. https://sabipro.vercel.app
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

- Never use `origin: '*'` in production
- `ALLOWED_ORIGIN` must be set in `apps/api/.env`

---

## Health Check

Both services must expose a health endpoint:

```
GET /health → { "status": "ok", "timestamp": "ISO8601" }
```

Used to keep Render from spinning down during active development and demos.

---

## Admin Dashboard Architecture

The admin dashboard is a protected route group within the Next.js frontend.
It shares the backend API but uses a dedicated layout and guard.

### Access control
- Every admin page wrapped in `AdminGuard` client component
- `AdminGuard` checks `session.user.role === 'ADMIN'` from NextAuth.js
- Non-admin users redirected to `/` immediately on the client
- All admin API routes protected by `JwtAuthGuard + RolesGuard + @Roles(Role.ADMIN)` on the backend
- Admin routes prefixed: `/api/admin/*`

### Admin layout shell
```tsx
// app/(admin)/layout.tsx
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-surface-bg">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </AdminGuard>
  );
}
```

### Admin sidebar navigation
```
Overview          /admin/dashboard
Providers         /admin/providers
Flagged Content   /admin/flags
Users             /admin/users
Transactions      /admin/transactions
```

### Dashboard metrics (overview page)
- Total registered users (consumers + providers)
- Active providers (ACTIVE + VERIFIED)
- Total inquiries this month
- Total successful transactions this month
- Total platform revenue this month (sum of platformFee from Payout)
- Pending vetting requests count
- Pending flagged content count

### Vetting workflow (admin)
1. Admin views provider list filtered by `isVerified: false` and `onboardingState: ACTIVE`
2. Admin reviews provider profile
3. Admin issues badge: `POST /api/admin/vetting/:id/approve`
4. Provider `isVerified` → true, `onboardingState` → VERIFIED
5. Provider receives `BADGE_ISSUED` notification

### Content moderation workflow (admin)
1. Admin views all reviews with `isFlagged: true`
2. Admin reads the review and the flag reason
3. Admin removes: `PATCH /api/admin/flags/:id/resolve` with `action: REMOVE`
   → sets `review.isVisible: false`, `flag.status: REMOVED`
4. Admin dismisses: same endpoint with `action: DISMISS`
   → review stays visible, `flag.status: DISMISSED`

---

## What This Architecture Does NOT Include (post-MVP)

- No WebSockets
- No Redis or in-memory caching
- No message queue
- No mobile app 
- No SMS notification