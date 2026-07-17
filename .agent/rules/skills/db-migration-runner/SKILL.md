---
trigger: always_on
---

# SKILL.md — Database Migration Runner

> Use this skill whenever you need to create, run, or manage
> Prisma database migrations in SabiPro.
> Read this file before touching the schema or running any migration command.

---

## Golden Rules

```
✓ schema.prisma is the single source of truth — always edit it first
✓ Use prisma migrate dev for all local development changes
✓ Use prisma migrate deploy for all production/staging deployments
✗ NEVER use prisma db push in any environment except throwaway local dev
✗ NEVER edit migration files manually
✗ NEVER delete migration files from prisma/migrations/
✗ NEVER run prisma migrate reset in production — it wipes the database
```

---

## Environment Setup

Ensure `DATABASE_URL` is set in `apps/api/.env`:

```
# Local development (Render or local PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Example local
DATABASE_URL="postgresql://postgres:password@localhost:5432/sabipro_dev?schema=public"
```

---

## Workflow: Adding or Changing a Model

### Step 1 — Edit `schema.prisma`

All changes start in `apps/api/prisma/schema.prisma`.
Never write raw SQL.

```prisma
// Example: adding a new field to Provider
model Provider {
  id            String  @id @default(cuid())
  // ... existing fields ...
  serviceRadius Int?    // ← new optional field
}
```

### Step 2 — Create the migration

```bash
# From apps/api/
npx prisma migrate dev --name describe_your_change

# Examples of good migration names:
npx prisma migrate dev --name add_service_radius_to_provider
npx prisma migrate dev --name create_content_flag_model
npx prisma migrate dev --name add_payout_status_enum
npx prisma migrate dev --name rename_is_verified_to_badge_verified
```

This command:
1. Generates a new SQL migration file in `prisma/migrations/`
2. Applies it to your local development database
3. Regenerates the Prisma client

### Step 3 — Verify the migration

```bash
# Check migration status
npx prisma migrate status

# Open Prisma Studio to inspect the database visually (local only)
npx prisma studio
```

### Step 4 — Commit both files

```bash
# Always commit schema.prisma AND the new migration together
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat: add service radius to provider profile"
```

---

## Workflow: Applying Migrations to Production (Render)

Render runs the deploy command on every push to `main`.
Configure the build command in Render dashboard:

```bash
# Render Start Command for NestJS backend
npx prisma migrate deploy && node dist/main.js
```

`prisma migrate deploy` applies any pending migrations that have not yet
run on the production database. It never creates new migrations —
only applies existing ones from `prisma/migrations/`.

---

## Command Reference

| Command | When to use | Environment |
|---------|------------|-------------|
| `prisma migrate dev --name <name>` | After editing schema.prisma | Local dev only |
| `prisma migrate deploy` | Deploy pending migrations | Production / Staging / CI |
| `prisma migrate status` | Check which migrations have run | Any |
| `prisma generate` | Regenerate Prisma client after schema change | Any |
| `prisma studio` | Inspect database via GUI | Local dev only |
| `prisma migrate reset` | Wipe DB and rerun all migrations | Local dev only — DANGER |
| `prisma db push` | Push schema without creating migration | Throwaway local — NEVER in production |
| `prisma db seed` | Run seed file | Local dev / staging only |

---

## Seeding (Local Dev and Staging Only)

```typescript
// apps/api/prisma/seed.ts
import { PrismaClient, Role, OnboardingState } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@sabipro.com' },
    update: {},
    create: {
      name: 'SabiPro Admin',
      email: 'admin@sabipro.com',
      password: await bcrypt.hash('Admin@1234!', 12),
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // Sample consumer
  await prisma.user.upsert({
    where: { email: 'consumer@test.com' },
    update: {},
    create: {
      name: 'Test Consumer',
      email: 'consumer@test.com',
      password: await bcrypt.hash('Test@1234!', 12),
      role: Role.CONSUMER,
      isVerified: true,
    },
  });

  // Sample provider
  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@test.com' },
    update: {},
    create: {
      name: 'Emeka Okafor',
      email: 'provider@test.com',
      password: await bcrypt.hash('Test@1234!', 12),
      role: Role.PROVIDER,
      isVerified: true,
    },
  });

  await prisma.provider.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      userId: providerUser.id,
      slug: 'emeka-okafor-electrician-lekki',
      tradeCategory: 'Electrician',
      location: 'Lekki, Lagos',
      bio: '10 years experience in residential and commercial wiring.',
      priceRange: '₦10,000 – ₦50,000',
      isAvailable: true,
      onboardingState: OnboardingState.ACTIVE,
    },
  });

  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
# Run the seed
npx prisma db seed

# package.json — add seed configuration
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Common Migration Scenarios

### Adding a nullable field
```prisma
model Provider {
  serviceRadius Int?   // nullable — no migration data concern
}
```

### Adding a required field with a default
```prisma
model Provider {
  verificationAttempts Int @default(0)  // default handles existing rows
}
```

### Adding a required field without a default (careful)
```prisma
// This will fail if the table has existing rows
// Option 1: make it nullable first, backfill, then make required
// Option 2: add a default value
model Review {
  source String @default("platform")  // add default for existing rows
}
```

### Renaming a field
```
⚠️  Prisma treats rename as DROP + ADD — existing data is lost.
✓  Correct approach:
   1. Add the new field (nullable)
   2. Migrate dev — apply
   3. Write a data migration script to copy values
   4. Remove the old field
   5. Migrate dev — apply
   Never just rename in schema.prisma directly.
```

### Adding a new enum value
```prisma
enum InquiryStatus {
  PENDING
  SEEN
  RESPONDED
  CLOSED
  ARCHIVED   // ← new value — safe to add
}
```

### Removing an enum value
```
⚠️  Dangerous — fails if any rows use that value.
✓  Correct approach:
   1. Update all rows using the old value first
   2. Then remove the enum value
   3. Migrate dev
```

---

## Troubleshooting

### Migration drift error
```bash
# Schema and database are out of sync
npx prisma migrate dev  # will detect drift and prompt to reset (LOCAL ONLY)
```

### Client out of sync after schema change
```bash
# Regenerate the Prisma client
npx prisma generate
```

### Migration failed mid-way (local)
```bash
# Check migration status
npx prisma migrate status

# If stuck, resolve manually or reset (LOCAL ONLY)
npx prisma migrate reset   # WIPES LOCAL DATABASE — use with care
```

### Production migration failed
```
1. Check Render deploy logs for the exact error
2. Do NOT run prisma migrate reset — it wipes the database
3. Fix the schema or data issue locally
4. Create a corrective migration
5. Redeploy
```

---

## CI/CD Integration

Add to your CI pipeline (GitHub Actions example):

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  run: npx prisma migrate deploy
  working-directory: apps/api
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Files Never to Edit or Delete

```
apps/api/prisma/migrations/         ← Never edit any file here
apps/api/prisma/migrations/*/migration.sql  ← Never modify SQL manually
```

These are the source of truth for database history.
Editing them corrupts the migration chain.