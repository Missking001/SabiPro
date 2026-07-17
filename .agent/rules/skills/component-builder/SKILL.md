---
trigger: always_on
---

# SKILL.md — Component Builder

> Use this skill whenever you are creating a new React component
> in the SabiPro frontend. Follow every step in order.

---

## When to Use This Skill

- Building a new UI component from scratch
- Rebuilding an existing component to fix structure or accessibility issues
- Scaffolding a page component

---

## Step 1 — Determine Component Type

Before writing code, answer these questions:

| Question | Answer determines |
|----------|------------------|
| Does this component fetch data? | If yes → server component (no `'use client'`) |
| Does this component use state, events, or browser APIs? | If yes → client component (add `'use client'`) |
| Is this a page? | `app/**/page.tsx` — default server component |
| Is this a reusable primitive (Button, Input, Badge)? | `components/ui/` |
| Is this domain-specific (ProviderCard, ReviewForm)? | `components/[domain]/` |

---

## Step 2 — File Location

```
Primitive UI element      → components/ui/ComponentName.tsx
Provider-related          → components/provider/ComponentName.tsx
Search-related            → components/search/ComponentName.tsx
Review-related            → components/review/ComponentName.tsx
Inquiry-related           → components/inquiry/ComponentName.tsx
Payment-related           → components/payment/ComponentName.tsx
Layout (Navbar, Footer)   → components/layout/ComponentName.tsx
Page component            → app/(group)/route/page.tsx
```

---

## Step 3 — Component Template

### Server Component (default)

```tsx
// components/provider/ProviderCard.tsx

import Image from 'next/image';
import Link from 'next/link';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { StarRating } from '@/components/ui/StarRating';
import type { ProviderSummary } from '@/types/provider';

interface ProviderCardProps {
  provider: ProviderSummary;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="
        block bg-neutral-0 border border-surface-border
        rounded-card shadow-sm
        p-4 md:p-6
        hover:border-primary-base hover:shadow-md
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-primary-base focus:ring-offset-2
      "
      aria-label={`View profile for ${provider.name}, ${provider.tradeCategory} in ${provider.location}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-surface-bg">
          {provider.avatarUrl ? (
            <Image
              src={provider.avatarUrl}
              alt={`${provider.name} profile photo`}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center
                         bg-primary-tint text-primary-base text-subhead font-medium"
              aria-hidden="true"
            >
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-subhead font-medium text-neutral-900 truncate">
              {provider.name}
            </h3>
            {provider.isVerified && <VerifiedBadge />}
          </div>
          <p className="text-small text-neutral-700 mt-0.5">{provider.tradeCategory}</p>
          <p className="text-caption text-neutral-500 mt-0.5">{provider.location}</p>
        </div>
      </div>

      {/* Rating and availability */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
        <StarRating rating={provider.averageRating} count={provider.totalReviews} />
        <span
          className={`
            text-caption font-medium px-2.5 py-1 rounded-pill
            ${provider.isAvailable
              ? 'bg-primary-tint text-primary-deep'
              : 'bg-surface-bg text-neutral-500'}
          `}
        >
          {provider.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>
    </Link>
  );
}
```

### Client Component

```tsx
// components/inquiry/InquiryForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBanner } from '@/components/ui/StatusBanner';

interface InquiryFormProps {
  providerId: string;
  providerName: string;
  onSuccess?: () => void;
}

export function InquiryForm({ providerId, providerName, onSuccess }: InquiryFormProps) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit() {
    if (!message.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ providerId, message: message.trim() }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message ?? 'Message failed to send. Please try again');
      }

      setStatus('success');
      setMessage('');
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Message failed to send. Please try again',
      );
    }
  }

  return (
    <div className="space-y-4">
      {status === 'error' && (
        <StatusBanner variant="error" message={errorMessage} />
      )}
      {status === 'success' && (
        <StatusBanner variant="success" message="Your message has been sent." />
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="inquiry-message" className="text-small font-medium text-neutral-700">
          Message <span className="text-error-base" aria-hidden="true">*</span>
        </label>
        <textarea
          id="inquiry-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Describe what you need from ${providerName}...`}
          rows={4}
          disabled={status === 'loading' || status === 'success'}
          className="
            w-full bg-neutral-0 border border-surface-input
            rounded-component px-4 py-3
            text-body text-neutral-900
            placeholder:text-neutral-500
            focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base
            disabled:bg-surface-bg disabled:cursor-not-allowed
            resize-none
          "
          aria-required="true"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || status === 'loading' || status === 'success'}
        isLoading={status === 'loading'}
        className="w-full"
      >
        Send Message
      </Button>
    </div>
  );
}
```

---

## Step 4 — Required States

Every component that handles async data or user interaction must implement all three:

```tsx
// Loading state — skeleton preferred over spinner for content
if (isLoading) return <ComponentSkeleton />;

// Error state — message + retry option
if (error) return (
  <StatusBanner variant="error" message={error.message} />
);

// Empty state — never leave blank
if (!data || data.length === 0) return (
  <EmptyState
    icon="🔍"
    title="No providers found"
    description="Try a different trade or location"
  />
);

// Success state — render content
return <div>...</div>;
```

---

## Step 5 — Accessibility Checklist

Before marking a component complete, verify:

- [ ] All images have descriptive `alt` text
- [ ] All form inputs have associated `<label>` elements
- [ ] Error messages use `role="alert"`
- [ ] Interactive elements are keyboard navigable
- [ ] Touch targets are minimum 44×44px
- [ ] Icon-only buttons have `aria-label`
- [ ] Links have descriptive text — not "click here"
- [ ] Focus styles are visible — never `outline-none` without a replacement

---

## Step 6 — TypeScript Checklist

- [ ] Props interface defined above the component
- [ ] No `any` types
- [ ] Return type annotated if not inferrable
- [ ] All event handlers typed (e.g. `React.ChangeEvent<HTMLInputElement>`)

---

## Step 7 — Named Export

```tsx
// ✓ Named export always
export function ProviderCard({ ... }) { ... }

// ✗ No default exports (except page.tsx and layout.tsx)
export default function ProviderCard() { ... } // forbidden for components
```

---

## Step 8 — Index Barrel (optional, for component groups)

If the component folder has 3+ components, add a barrel:

```typescript
// components/provider/index.ts
export { ProviderCard } from './ProviderCard';
export { ProviderProfile } from './ProviderProfile';
export { ProviderSkeleton } from './ProviderSkeleton';
```

---

## Common Mistakes to Avoid

```
✗ Client component for data-fetching only — use server component
✗ Missing loading / error / empty state
✗ <img> instead of next/image
✗ <a> instead of next/link for internal navigation
✗ Placeholder text as label substitute
✗ Removing focus:outline without replacing it
✗ Hardcoded colours — always use design system tokens
✗ Default export for non-page components
✗ Calling fetch directly in a component — use lib/api.ts
```