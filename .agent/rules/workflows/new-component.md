---
trigger: always_on
---

# workflows/new-component.md — New Component Workflow

> Follow this workflow in order every time you create a new
> React component in the SabiPro frontend.
> Do not skip steps.

---

## Trigger

Use this workflow when:
- Asked to build a new UI element, card, form, or page section
- Rebuilding an existing component
- Scaffolding a new page

---

## Step 1 — Read Context Files

Before writing any code, read:

```
.agent/rules/design-system.md     ← colours, typography, spacing, component patterns
.agent/rules/code-style.md        ← TypeScript rules, naming, forbidden patterns
skills/component-builder/SKILL.md  ← component templates and checklist
```

---

## Step 2 — Classify the Component

Answer these questions before choosing a file location:

```
Is it data-fetching only?          → Server component (no 'use client')
Does it use state/events/browser?  → Client component ('use client')
Is it a reusable primitive?        → components/ui/
Is it domain-specific?             → components/[domain]/
Is it a full page?                 → app/(group)/route/page.tsx
```

---

## Step 3 — Define the Props Interface

Write the TypeScript interface before writing JSX.
Import types from `@/types/` where they exist.

```typescript
interface ComponentNameProps {
  // required props first
  requiredProp: string;
  // optional props after
  optionalProp?: () => void;
}
```

---

## Step 4 — Scaffold the Component Shell

```tsx
// 'use client'; ← only if needed

import type { ComponentNameProps } from '@/types/...';

export function ComponentName({ requiredProp, optionalProp }: ComponentNameProps) {
  // loading state
  // error state
  // empty state
  // success/content state

  return (
    <div>
      {/* content */}
    </div>
  );
}
```

---

## Step 5 — Apply Design System

- Use only colours from `design-system.md` colour tokens
- Use only Tailwind utility classes — no inline styles
- Use `rounded-component` (8px) for UI elements, `rounded-card` (12px) for cards
- Use `border border-surface-border` for card borders — never a thicker border
- Ensure all touch targets are `min-h-[44px] min-w-[44px]`
- Page background: `bg-surface-bg` (`#F7F6F2`) — not `bg-white`

---

## Step 6 — Implement All Three States

Every async or conditional component must have all three:

```tsx
// 1. Loading — skeleton preferred
if (isLoading) return <ComponentNameSkeleton />;

// 2. Error — message + retry
if (error) return (
  <StatusBanner variant="error" message={error.message} />
);

// 3. Empty — never a blank screen
if (!data || data.length === 0) return (
  <EmptyState icon="🔍" title="..." description="..." />
);
```

---

## Step 7 — Accessibility Pass

Check every item:

- [ ] `<Image alt="descriptive text" />` on all images
- [ ] `<label htmlFor="...">` linked to every input
- [ ] `role="alert"` on error messages
- [ ] `aria-label` on icon-only buttons
- [ ] Keyboard navigability — test Tab key flow
- [ ] Focus ring visible — never `outline-none` without replacement
- [ ] Minimum 44×44px touch targets
- [ ] No colour-only meaning — pair with text or icon

---

## Step 8 — TypeScript Pass

- [ ] No `any`
- [ ] Props interface defined
- [ ] Event handlers typed
- [ ] Return type inferred or annotated

---

## Step 9 — Mobile-First Check

- [ ] Mobile layout (single column) works at 375px width
- [ ] Desktop layout adjusts at `md:` breakpoint
- [ ] No horizontal overflow on mobile
- [ ] Text is readable at mobile font sizes

---

## Step 10 — Export

```tsx
// Named export — always
export function ComponentName(...) { ... }

// Only page.tsx and layout.tsx use default exports
```

---

## Step 11 — Done Criteria

The component is complete when:

- [ ] It renders correctly in all three states (loading, error, empty/success)
- [ ] It uses only design system tokens
- [ ] It passes the accessibility checklist
- [ ] It has no TypeScript errors
- [ ] It is mobile-first responsive
- [ ] It has a named export
- [ ] It is placed in the correct folder

---

## Example — Full Component Output

```tsx
// components/provider/ProviderCard.tsx
import Image from 'next/image';
import Link from 'next/link';
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
        rounded-card shadow-sm p-4 md:p-6
        hover:border-primary-base hover:shadow-md
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-primary-base focus:ring-offset-2
      "
      aria-label={`View profile for ${provider.name}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          {provider.avatarUrl ? (
            <Image
              src={provider.avatarUrl}
              alt={`${provider.name} profile photo`}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-tint text-primary-base text-subhead font-medium" aria-hidden="true">
              {provider.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-subhead font-medium text-neutral-900 truncate">
            {provider.name}
          </h3>
          <p className="text-small text-neutral-700">{provider.tradeCategory}</p>
          <p className="text-caption text-neutral-500">{provider.location}</p>
        </div>
      </div>
    </Link>
  );
}
```