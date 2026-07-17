---
trigger: always_on
---

# security.md — SabiPro Security Rules

> Read this before building any auth, payment, file upload, or data-access feature.
> Every rule here is a hard requirement — not a suggestion.

---

## Secrets and Environment Variables

```
✗ NEVER hardcode secrets or credentials anywhere in code
✗ NEVER commit .env files to version control
✗ NEVER expose these to the frontend or NEXT_PUBLIC_ variables:
  JWT_SECRET · SUPABASE_SERVICE_ROLE_KEY · FLW_SECRET_KEY
  FLW_WEBHOOK_SECRET · DATABASE_URL · MAIL_PASS
```

- All required variables documented in `.env.example` with empty values
- `.env`, `.env.local`, `.env.production`, `*.pem` in `.gitignore`

---

## Authentication Security

**Password handling**
- Hash with bcrypt — minimum 12 rounds (`SALT_ROUNDS = 12`)
- Never store plain text · never return password in any response · never log it
- Minimum 8 chars, one uppercase, one number, one special character

**JWT**
- Payload: `{ sub: userId, email, role, iat, exp }`
- Store in `httpOnly` cookie — never `localStorage` or `sessionStorage`
- Expiry: 7 days · `JWT_SECRET` must be identical in both `.env.local` and `.env`

**Login protection**
- Lock account after 5 consecutive failed attempts
- Send unlock email automatically · reset counter on success

**Email verification**
- Signed token, expires 24 hours, invalidated after first use
- `isVerified: false` blocks login until verified

**Password reset**
- Token expires 1 hour · single-use · invalidate all sessions on change
- Never confirm if an email exists — always show generic success message

---

## Authorization (RBAC)

- Enforce at NestJS guard level — UI-only access control is not the security gate
- Always check role AND ownership — provider can only update their own profile
- Admin routes `/api/admin/*` — dedicated `AdminGuard` on both frontend and backend
- Non-admin users redirected to `/` — never shown a 403 in the admin UI
- Never trust role from client — always decode from verified JWT

---

## Input Validation

- All inputs validated server-side via class-validator DTOs
- `ValidationPipe` global in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`
- SQL injection prevented by Prisma parameterised queries — never `$queryRaw` with interpolation
- All string inputs trimmed and case-insensitive before DB queries
- Rating: `@IsInt() @Min(1) @Max(5)` · File: validate MIME + size server-side before Supabase

---

## Flutterwave Webhook Security

- Always verify `FLW-Signature` header using HMAC-SHA256 of the **raw body buffer**
- Use `crypto.timingSafeEqual` to compare hashes — prevents timing attacks
- Idempotency: check `gatewayRef` exists before processing — same ref never processed twice
- Return `200` to Flutterwave immediately — never make the gateway wait
- `FLW_SECRET_KEY` and `FLW_WEBHOOK_SECRET` must never appear in frontend code

---

## Data Privacy

Never return in any API response:
`password` · `phone` (unless opted in) · `email` (public responses) · `accountNumber` · any secret key

- Always use Prisma `select` — never return full objects blindly
- Encrypt provider bank account numbers at rest using a server-side key in env vars
- Phone numbers: private by default — only exposed if provider opts in

---

## Rate Limiting

Use `@nestjs/throttler` on these endpoints:

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/login` | 5 / min |
| `POST /api/auth/register` | 10 / hour |
| `POST /api/auth/forgot-password` | 3 / hour |
| `POST /api/inquiries` | 5 / min |
| `POST /api/reviews` | 10 / hour |
| `POST /api/payments/initiate` | 3 / min |

---

## CORS

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGIN, // exact domain — no wildcard
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## File Upload Security

- Validate MIME type from file buffer — never trust the client content-type header
- Generated filenames only: `${userId}/${Date.now()}-${crypto.randomUUID()}.webp`
- Buckets: `portfolios/` and `avatars/` — public read, backend-only write
- Clean up orphaned files on upload failure

---

## Error Messages

- Never expose stack traces, DB errors, or internal details to the client
- Log full error internally with `this.logger.error` — return generic message to user
- Auth errors: never confirm if an email exists

---

## Security Headers and Dependencies

```typescript
import helmet from 'helmet';
app.use(helmet()); // sets X-Frame-Options, XSS-Protection, HSTS, CSP
```

- Run `npm audit` before every deployment
- Lock versions with `package-lock.json` committed to version control

---

## Admin Dashboard Security

**Frontend guard** — `components/admin/AdminGuard.tsx`
```tsx
'use client';
export function AdminGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status !== 'loading' && session?.user.role !== 'ADMIN') router.replace('/');
  }, [session, status, router]);
  if (status === 'loading' || session?.user.role !== 'ADMIN') return null;
  return <>{children}</>;
}
```

**Backend guard** — every admin controller:
```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController { ... }
```

**Admin-specific rules**
- All admin actions logged with `adminId` and timestamp
- Admin cannot delete their own account or change their own role
- At least one active ADMIN account must exist at all times

---

## Production Checklist

- [ ] `.env` files excluded from version control
- [ ] `JWT_SECRET` randomly generated — min 32 chars
- [ ] `FLW_WEBHOOK_SECRET` set — webhook signature verification active
- [ ] `ALLOWED_ORIGIN` set to exact frontend domain
- [ ] Helmet configured · rate limiting active
- [ ] `prisma migrate deploy` used — never `prisma db push`
- [ ] No `console.log` · no hardcoded secrets
- [ ] `npm audit` passes — no critical vulnerabilities