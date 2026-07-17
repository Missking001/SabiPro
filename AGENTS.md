# AGENTS.md — SabiPro

> This file is the single source of context for any AI agent working on the SabiPro codebase.
> Read this entire file before writing a single line of code, making any architectural decision,
> or suggesting any change. Every decision must trace back to something defined here.

---

## 1. Project Identity

**Product:** SabiPro — Local Service Finder
**Mission:** Connect consumers in Nigerian cities with vetted local tradespeople through a trusted, searchable, community-verified platform.
**Stage:** Bootcamp assessment project — production quality expected.
**Tagline:** Maximum trust. Maximum discoverability. Minimum friction.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend framework | Next.js 14 (App Router) | SSR required for Open Graph / WhatsApp previews |
| Styling | Tailwind CSS | Mobile-first, utility classes only |
| Auth (client) | NextAuth.js | CredentialsProvider, JWT stored in httpOnly cookie |
| Backend framework | NestJS | Long-running server — NOT serverless |
| Database | PostgreSQL | Relational — hosted on Render |
| ORM | Prisma | Schema-first, type-safe, migration-driven |
| File storage | Supabase Storage | Portfolio and avatar image uploads, CDN delivery |
| Email | Nodemailer | Transactional email — verification, reset, notifications |
| Payment gateway | Flutterwave | Pay-on-booking escrow flow, sandbox for testing |
| Frontend host | Vercel | Next.js native deployment |
| Backend host | Render | Free tier — spins down after 15 min inactivity |

### Stack rules
- Do NOT suggest replacing any item in this stack without explicit instruction
- Do NOT use Vercel serverless functions for the NestJS backend
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` or any secrets to the client
- Prisma is the only way to interact with the database — no raw SQL string interpolation
- All money values stored and processed in **kobo** (smallest unit) — never floats

---

## 3. Repository Structure

```
sabipro/
├── apps/
│   ├── web/                    # Next.js frontend (Vercel)
│   │   ├── app/                # App Router pages and layouts
│   │   │   ├── (auth)/         # Login, register, verify-email
│   │   │   ├── (consumer)/     # Search, provider profile, inquiry
│   │   │   ├── (provider)/     # Dashboard, profile management
│   │   │   ├── (admin)/        # Admin panel (feature-flagged OFF)
│   │   │   └── api/auth/       # NextAuth.js route handler
│   │   ├── components/         # Shared UI components
│   │   ├── lib/                # Utilities, API client, auth helpers
│   │   └── .env.local          # Frontend environment variables
│   └── api/                    # NestJS backend (Render)
│       ├── src/
│       │   ├── auth/           # Auth module — register, login, verify, reset
│       │   ├── providers/      # Provider module — CRUD, search, onboarding
│       │   ├── reviews/        # Review module — submit, flag, moderate
│       │   ├── inquiries/      # Inquiry module — send, status, dedup
│       │   ├── notifications/  # Notification module — in-app + email
│       │   ├── payments/       # Payment module — Flutterwave, escrow, payouts
│       │   ├── admin/          # Admin module — vetting, moderation, suspend
│       │   ├── common/         # Guards, interceptors, decorators, pipes
│       │   └── prisma/         # Prisma service and client
│       ├── prisma/
│       │   ├── schema.prisma   # Single source of truth for all models
│       │   └── migrations/     # Never edit manually
│       └── .env                # Backend environment variables
├── packages/
│   └── types/                  # Shared TypeScript types (if monorepo)
└── AGENTS.md                   # This file
```

---

## 4. Environment Variables

### Frontend — `apps/web/.env.local`
```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_API_URL=
JWT_SECRET=
```

### Backend — `apps/api/.env`
```
DATABASE_URL=
JWT_SECRET=                     # Must match frontend JWT_SECRET exactly
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Never expose to client
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
FLW_PUBLIC_KEY=                 # Flutterwave public key
FLW_SECRET_KEY=                 # Flutterwave secret key — never expose to client
FLW_WEBHOOK_SECRET=             # Flutterwave webhook verification hash
ALLOWED_ORIGIN=
NODE_ENV=
PLATFORM_FEE_PERCENT=           # e.g. 10 for 10% — stored in config, not hardcoded
```

**Rules:**
- Never hardcode any of the above values anywhere in the codebase
- All required variables must be documented in `.env.example` at project root
- Never generate or suggest real credentials, API keys, or secrets

---

## 5. Data Models

These are canonical. All code must reflect these exactly. Do not deviate without updating this file first.

### User
```prisma
model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  role        Role     @default(CONSUMER)
  avatarUrl   String?
  phone       String?
  city        String?
  isActive    Boolean  @default(true)
  isVerified  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Role {
  CONSUMER
  PROVIDER
  ADMIN
}
```

### Provider
```prisma
model Provider {
  id              String          @id @default(cuid())
  userId          String          @unique
  slug            String          @unique
  bio             String?
  tradeCategory   String
  location        String
  portfolioUrls   String[]
  priceRange      String?
  isAvailable     Boolean         @default(true)
  onboardingState OnboardingState @default(REGISTERED)
  averageRating   Float           @default(0.0)
  totalReviews    Int             @default(0)
  isVerified      Boolean         @default(false)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum OnboardingState {
  REGISTERED
  PROFILE_COMPLETE
  ACTIVE
  VERIFIED
}
```

### Review
```prisma
model Review {
  id          String   @id @default(cuid())
  consumerId  String
  providerId  String
  rating      Int
  comment     String?
  isVisible   Boolean  @default(true)
  isFlagged   Boolean  @default(false)
  flaggedAt   DateTime?
  createdAt   DateTime @default(now())

  @@unique([consumerId, providerId])
}
```

### Inquiry
```prisma
model Inquiry {
  id          String        @id @default(cuid())
  consumerId  String
  providerId  String
  message     String
  status      InquiryStatus @default(PENDING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum InquiryStatus {
  PENDING
  SEEN
  RESPONDED
  CLOSED
}
```

### VettingBadge
```prisma
model VettingBadge {
  id         String    @id @default(cuid())
  providerId String    @unique
  badgeType  BadgeType
  issuedAt   DateTime  @default(now())
  expiresAt  DateTime?
  issuedBy   String
  isActive   Boolean   @default(true)
}

enum BadgeType {
  IDENTITY
  CREDENTIAL
  BOTH
}
```

### Notification
```prisma
model Notification {
  id          String           @id @default(cuid())
  userId      String
  type        NotificationType
  message     String
  channel     Channel          @default(IN_APP)
  isRead      Boolean          @default(false)
  relatedId   String?
  relatedType String?
  createdAt   DateTime         @default(now())
}

enum NotificationType {
  INQUIRY_RECEIVED
  INQUIRY_REPLIED
  REVIEW_POSTED
  BADGE_ISSUED
  BADGE_REVOKED
  ACCOUNT_SUSPENDED
  PAYMENT_INITIATED
  PAYMENT_CONFIRMED
  PAYMENT_FAILED
  PAYOUT_RELEASED
  DISPUTE_RAISED
  DISPUTE_RESOLVED
  REFUND_ISSUED
  PAYOUT_WITHHELD
}

enum Channel {
  IN_APP
  EMAIL
}
```

### Transaction
```prisma
model Transaction {
  id               String        @id @default(cuid())
  consumerId       String
  providerId       String
  inquiryId        String?
  amount           Int
  currency         String        @default("NGN")
  status           TxStatus      @default(PENDING)
  gatewayRef       String        @unique
  gatewayStatus    String
  payoutStatus     PayoutStatus  @default(PENDING)
  payoutReleasedAt DateTime?
  metadata         Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

enum TxStatus {
  PENDING
  SUCCESSFUL
  FAILED
  REFUNDED
  DISPUTED
}

enum PayoutStatus {
  PENDING
  RELEASED
  WITHHELD
}
```

### Payout
```prisma
model Payout {
  id            String       @id @default(cuid())
  providerId    String
  transactionId String
  amount        Int
  platformFee   Int
  status        PayoutState  @default(PENDING)
  bankCode      String
  accountNumber String
  gatewayRef    String?
  processedAt   DateTime?
  createdAt     DateTime     @default(now())
}

enum PayoutState {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### ContentFlag
```prisma
model ContentFlag {
  id          String     @id @default(cuid())
  reportedBy  String
  targetId    String
  targetType  FlagTarget
  reason      String?
  status      FlagStatus @default(PENDING)
  resolvedBy  String?
  resolvedAt  DateTime?
  createdAt   DateTime   @default(now())
}

enum FlagTarget {
  REVIEW
  INQUIRY
}

enum FlagStatus {
  PENDING
  REVIEWED
  DISMISSED
  REMOVED
}
```

---

## 6. API Conventions

### Base URL
- Frontend calls backend at: `NEXT_PUBLIC_API_URL` (e.g. `https://sabipro-api.onrender.com`)

### URL Patterns
```
GET    /api/providers                   List and search providers
GET    /api/providers/:slug             Single provider profile
POST   /api/providers                   Create provider profile
PATCH  /api/providers/:id               Update provider profile
DELETE /api/providers/:id               Deactivate provider

GET    /api/providers/:id/reviews       Reviews for a provider
POST   /api/reviews                     Submit a review
DELETE /api/reviews/:id                 Remove review (admin only)
POST   /api/reviews/:id/flag            Flag a review

POST   /api/inquiries                   Send an inquiry
GET    /api/inquiries/:id               Get inquiry
PATCH  /api/inquiries/:id               Update status

GET    /api/notifications               Current user notifications
PATCH  /api/notifications/:id/read      Mark as read
PATCH  /api/notifications/read-all      Mark all as read

POST   /api/auth/register               Register
POST   /api/auth/login                  Login
POST   /api/auth/logout                 Logout
GET    /api/auth/me                     Current user
POST   /api/auth/verify-email           Verify email
POST   /api/auth/forgot-password        Request reset
POST   /api/auth/reset-password         Submit new password

POST   /api/payments/initiate           Initiate payment
POST   /api/payments/webhook            Flutterwave webhook (no auth)
GET    /api/payments/:id                Single transaction
GET    /api/payments/consumer/history   Consumer tx history
GET    /api/payments/provider/history   Provider tx history
POST   /api/payments/:id/release        Release payout
POST   /api/payments/:id/dispute        Raise dispute
POST   /api/payments/:id/refund         Admin refund
POST   /api/payouts/provider-details    Submit bank details
GET    /api/payouts/:id                 Single payout

POST   /api/admin/vetting/:id/approve   Approve vetting
POST   /api/admin/vetting/:id/revoke    Revoke badge
GET    /api/admin/flags                 All flagged content
PATCH  /api/admin/flags/:id/resolve     Resolve flag
PATCH  /api/admin/users/:id/suspend     Suspend user

GET    /health                          Health check — { status: "ok" }
```

### Response Envelope
Every response must use this shape — no bare objects:
```json
// Success
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 42 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email"
  }
}
```

### HTTP Status Codes
```
200  OK
201  Created
400  Bad Request
401  Unauthorized
403  Forbidden
404  Not Found
422  Unprocessable Entity
500  Internal Server Error
```

### Rules
- All list endpoints paginate at 20 results per page
- Dates always returned in ISO 8601 format
- Never return: password, hashed values, phone numbers (unless opted in), SUPABASE_SERVICE_ROLE_KEY, FLW_SECRET_KEY
- Search input must be trimmed and case-insensitive before hitting the database
- Empty search results return `200` with empty `data: []` — never `404`

---

## 7. Auth Flow

### Cross-service auth
1. NextAuth.js CredentialsProvider sends credentials to NestJS `/api/auth/login`
2. NestJS validates password (bcrypt), `isActive`, `isVerified`
3. Returns user object to NextAuth.js
4. NextAuth.js issues JWT stored in `httpOnly` cookie
5. JWT payload: `{ userId, email, role, iat, exp }`
6. Frontend attaches JWT to every backend request: `Authorization: Bearer <token>`
7. NestJS `JwtAuthGuard` validates token on every protected route
8. `req.user.role` drives RBAC in guards

### Shared secret
- `JWT_SECRET` must be identical in both `.env.local` and `.env`
- Token expiry: 7 days

### Email verification
- Required before login is allowed
- Token expires in 24 hours
- Sent via Nodemailer on registration

### Password reset
- Link expires in 1 hour
- All active sessions invalidated on password change

### Login failure rules
- Account locked after 5 consecutive failed attempts
- Unlock email sent automatically

---

## 8. Role-Based Access Control

Enforce at NestJS middleware level. UI enforcement is UX only — never the security gate.

| Action | Consumer | Provider | Admin |
|--------|----------|----------|-------|
| Search providers | ✓ | ✓ | ✓ |
| View provider profile | ✓ | ✓ | ✓ |
| Create provider profile | ✗ | ✓ | ✓ |
| Update own profile | ✗ | ✓ | ✓ |
| Send inquiry | ✓ | ✗ | ✗ |
| Respond to inquiry | ✗ | ✓ | ✗ |
| Submit review | ✓ | ✗ | ✗ |
| Flag review | ✓ | ✓ | ✗ |
| Delete review | ✗ | ✗ | ✓ |
| Issue vetting badge | ✗ | ✗ | ✓ |
| Revoke vetting badge | ✗ | ✗ | ✓ |
| Suspend account | ✗ | ✗ | ✓ |
| Initiate payment | ✓ | ✗ | ✗ |
| Release payout | ✓ | ✗ | ✗ |
| Issue refund | ✗ | ✗ | ✓ |

---

## 9. Feature Flags

Flags live in a central config file — not scattered inline.
Naming convention: `FEATURE_[NAME]` in screaming snake case.

```typescript
export const featureFlags = {
  FEATURE_VETTING_BADGES: true,
  FEATURE_INQUIRY_SYSTEM: true,
  FEATURE_NOTIFICATIONS: true,
  FEATURE_EMAIL_VERIFICATION: true,
  FEATURE_CONTENT_MODERATION: true,
  FEATURE_PROVIDER_ONBOARDING: true,
  FEATURE_PAYMENT_SYSTEM: true,
  FEATURE_ADMIN_PANEL: true,
};
```

**Rule:** Wrap any unfinished or flagged-off feature in a flag check before exposing it in the UI or API. Never skip this.

---

## 10. System Behaviour Rules

These are platform-level invariants. Every feature must respect them.

- Only providers with `onboardingState = ACTIVE | VERIFIED` appear in search results
- Suspended providers (`isActive: false`) are hidden from search immediately
- `averageRating` and `totalReviews` are recomputed inside a **Prisma transaction** on every Review create/delete
- Only reviews with `isVisible: true` are included in rating computation
- A consumer cannot send a second inquiry to the same provider within **10 minutes** — enforced server-side
- Provider slugs are auto-generated at creation, unique, URL-safe, and permanent — never editable by user
- Soft delete is preferred over hard delete for User, Provider, and Review
- Deleted user data shows as `[deleted user]` — personal fields anonymised within 30 days
- Phone numbers are never returned in public API responses unless provider has opted in
- All payment amounts in **kobo** — never floats
- Flutterwave webhook endpoint processes idempotently — same `gatewayRef` never creates two Transaction records
- Payout auto-releases after **7 days** if consumer has not marked job complete
- Bank account details encrypted at rest — never returned in API responses

---

## 11. Provider Onboarding States

```
REGISTERED → PROFILE_COMPLETE → ACTIVE → VERIFIED
```

| Transition | Trigger |
|-----------|---------|
| REGISTERED → PROFILE_COMPLETE | All required fields submitted and validated |
| PROFILE_COMPLETE → ACTIVE | Automatic on successful profile completion |
| ACTIVE → VERIFIED | Admin issues VettingBadge |
| VERIFIED → ACTIVE | Admin revokes VettingBadge |
| ANY → SUSPENDED | Admin sets isActive: false |

---

## 12. File Upload Rules

- Accepted formats: JPG, PNG, WebP only
- Max size per image: 2MB
- Max portfolio images: 6 per provider
- Max avatar size: 1MB
- Validation happens in NestJS **before** Supabase Storage is touched
- Raw binary never stored in the database — store the URL only
- Frontend never uploads directly to Supabase Storage
- Failed uploads must not leave orphaned files in storage — implement cleanup on failure

---

## 13. Design System

### Colour Tokens

**Primary (Forest Green)**
```
--color-primary-base:    #1A6B3C
--color-primary-hover:   #1D9E75
--color-primary-tint:    #EAF5EE
--color-primary-deep:    #085041
```

**Secondary (Ankara Gold)**
```
--color-secondary-base:  #D4801A
--color-secondary-hover: #EF9F27
--color-secondary-tint:  #FAEEDA
--color-secondary-deep:  #633806
```

**Tertiary (Cobalt Blue)**
```
--color-tertiary-base:   #185FA5
--color-tertiary-hover:  #378ADD
--color-tertiary-tint:   #E6F1FB
--color-tertiary-deep:   #0C447C
```

**Neutral**
```
--color-neutral-900:     #1A1A1A   (headings)
--color-neutral-700:     #444441   (body text)
--color-neutral-500:     #888780   (placeholder)
--color-neutral-0:       #FFFFFF   (surfaces)
```

**Neutral Variant**
```
--color-surface-bg:      #F7F6F2   (page background)
--color-surface-border:  #ECEAE3   (dividers)
--color-surface-input:   #D3D1C7   (input borders)
--color-surface-disabled:#B4B2A9   (disabled states)
```

**Semantic**
```
--color-error-bg:        #FCEBEB
--color-error-border:    #F7C1C1
--color-error-base:      #E24B4A
--color-error-text:      #A32D2D
--color-error-deep:      #791F1F

--color-success-bg:      #EAF5EE
--color-success-border:  #9FE1CB
--color-success-base:    #1D9E75
--color-success-text:    #0F6E56
--color-success-deep:    #085041

--color-warning-bg:      #FAEEDA
--color-warning-border:  #FAC775
--color-warning-base:    #EF9F27
--color-warning-text:    #BA7517
--color-warning-deep:    #633806

--color-info-bg:         #E6F1FB
--color-info-border:     #B5D4F4
--color-info-base:       #378ADD
--color-info-text:       #185FA5
--color-info-deep:       #0C447C
```

### Typography
- Font: System sans-serif stack or Inter
- Heading weight: 500 (never 600 or 700)
- Body: 16px / 400 / line-height 1.7
- All text: sentence case — never ALL CAPS or Title Case in UI copy

### Component Rules
- Border radius: 8px (components), 12px (cards)
- Borders: 0.5px solid — not 1px
- Touch targets: minimum 44×44px on mobile
- Colour contrast: WCAG AA minimum (4.5:1 for text)
- Never rely on colour alone to convey meaning — pair with text or icon

---

## 14. Performance Requirements

| Requirement | Target |
|------------|--------|
| Page load on 3G | Under 3 seconds |
| API list endpoint | Under 500ms |
| Image format | WebP via Supabase CDN |
| List pagination | 20 per page — never load all |
| Non-critical assets | Lazy loaded |

---

## 15. Error Handling Rules

- Every page and major component must have an error boundary
- Network errors show a user-friendly message with a retry option — never a blank screen
- Empty states must be implemented — never leave a blank UI
- Loading states on every async operation — skeleton screens preferred over spinners
- Form errors surface at field level — not just a generic top-level alert
- Never expose stack traces or internal error details to the client
- Log all unhandled errors internally

### Standard error messages
```
Missing field:        "Please complete all required fields"
Invalid profile URL:  "This profile is no longer available"
Inquiry failed:       "Message failed to send. Please try again"
Duplicate inquiry:    "You have already messaged this provider recently"
No search results:    "No providers found. Try a different search."
Expired session:      "Your session has expired. Please log in again"
Suspended account:    "Your account has been suspended"
Unverified email:     "Please verify your email before logging in"
Payment failed:       "Payment failed. Please try again"
Duplicate payment:    "This payment has already been processed"
Generic fallback:     "Something went wrong. Please try again later"
```

---

## 16. Testing Requirements

### Unit tests
- Pure functions, validators, data transformers
- Slug generation logic
- Rating recalculation logic
- kobo conversion utilities

### Integration tests
- All API routes — request/response against mocked DB
- Auth flows — register, verify email, login, reset password
- File upload validation
- RBAC enforcement — test each role against every protected route

### E2E tests — critical journeys
1. Consumer registers → verifies email → searches → sends inquiry
2. Provider registers → completes profile → reaches ACTIVE state
3. Consumer submits review → `averageRating` updates correctly
4. Admin issues and revokes a vetting badge
5. Consumer initiates payment → webhook fires → payout releases

### Rules
- Tests live alongside the code they test
- No feature is complete without a happy path test AND at least one failure case test
- Mock external services (Nodemailer, Supabase, Flutterwave) — never hit real services in tests
- Use test mode credentials for Flutterwave in CI

---

## 17. Git Conventions

### Commit format (Conventional Commits)
```
feat:      New feature
fix:       Bug fix
chore:     Tooling, config, dependencies
docs:      Documentation only
refactor:  Code change — no feature or fix
test:      Adding or updating tests
style:     Formatting only — no logic change
```

### Branching
```
main         Production-ready only — never commit directly
dev          Active development — all features merge here first
feature/*    Individual features  e.g. feature/provider-profile
fix/*        Bug fixes            e.g. fix/review-rating-calculation
```

---

## 18. Agent Behaviour Rules

These rules govern how the agent must behave throughout development.

### Always
- Read this entire file before starting any task
- Write production-quality code — this is treated as a real product
- Handle loading, error, and empty states in every component and route
- Use Nigerian context naturally — city names (Lagos, Abuja, Surulere), local examples, ₦ for currency
- Follow mobile-first design — the majority of users are on mobile
- Keep all secrets in environment variables
- Run Prisma migrations — never `prisma db push` in production
- Validate inputs on both client (UX) and server (enforcement)

### Never
- Hardcode values that belong in environment variables
- Use floats for money — always kobo
- Return passwords, hashed values, or secrets in API responses
- Expose `SUPABASE_SERVICE_ROLE_KEY` or `FLW_SECRET_KEY` to the client
- Skip loading, error, or empty states
- Commit directly to `main`
- Use `prisma db push` in production
- Build anything for a feature that is flagged off until the flag is enabled
- Guess at technical details — flag uncertainty and offer two options with tradeoffs

### When a request is ambiguous
- Ask exactly **one** clarifying question before proceeding
- Do not guess and do not proceed with assumptions

### When a request is outside MVP scope
- Flag it clearly
- Propose an alternative that stays within scope
- Do not implement it without explicit approval

### When uncertain about a library, API, or framework behaviour
- Say so explicitly
- Offer two options with tradeoffs
- Recommend verifying against official documentation
- Never fabricate documentation or API behaviour

---

## 19. SEO and Shareability

Provider profiles are designed to be shared on WhatsApp with a rich preview.

- Profile URL pattern: `/providers/[slug]`
- Every profile page must be server-rendered with these meta tags:
  - `<title>`: `[Name] — [Trade] in [Location] | SabiPro`
  - `meta description`: provider bio (max 160 chars) or default
  - `og:title`, `og:description`, `og:image`, `og:url`
- `og:image`: provider avatar or first portfolio image
- If bio is empty: `[Name] is a [Trade] on SabiPro`
- Meta tags must be rendered server-side — not injected client-side

---

## 20. Open Questions (Resolve Before Building Affected Features)

- [ ] Content moderation for reviews — automated filter or manual admin queue?
- [ ] Can providers mark an inquiry as spam?
- [ ] Password complexity requirement — minimum length and character rules?
- [ ] Admin panel — separate Next.js route group or standalone app?
- [ ] Nodemailer SMTP provider — which service for local testing? (Ethereal recommended)
- [ ] Flutterwave webhook URL — confirm base URL format before payment feature

---

*Last updated: June 2026 — SabiPro MVP v1.0*
*All development decisions must trace back to a requirement defined here or in the PRD.*