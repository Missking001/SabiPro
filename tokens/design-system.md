---
trigger: always_on
---

# design-system.md — SabiPro Design System

> Governs every visual and UI decision in the frontend.
> Read before building any component, page, or layout.
> Do not introduce colours, spacing, or typography outside this system.

---

## Colour Tokens

Define in `app/globals.css` and extend in `tailwind.config.ts`.

```css
:root {
  /* Primary — Forest Green */
  --color-primary-base: #1A6B3C; --color-primary-hover: #1D9E75;
  --color-primary-tint: #EAF5EE; --color-primary-deep:  #085041;

  /* Secondary — Ankara Gold */
  --color-secondary-base: #D4801A; --color-secondary-hover: #EF9F27;
  --color-secondary-tint: #FAEEDA; --color-secondary-deep:  #633806;

  /* Tertiary — Cobalt Blue */
  --color-tertiary-base: #185FA5; --color-tertiary-hover: #378ADD;
  --color-tertiary-tint: #E6F1FB; --color-tertiary-deep:  #0C447C;

  /* Neutral */
  --color-neutral-900: #1A1A1A; --color-neutral-700: #444441;
  --color-neutral-500: #888780; --color-neutral-0:   #FFFFFF;

  /* Surface */
  --color-surface-bg: #F7F6F2; --color-surface-border:   #ECEAE3;
  --color-surface-input: #D3D1C7; --color-surface-disabled: #B4B2A9;

  /* Error */
  --color-error-bg: #FCEBEB; --color-error-border: #F7C1C1;
  --color-error-base: #E24B4A; --color-error-text: #A32D2D; --color-error-deep: #791F1F;

  /* Success */
  --color-success-bg: #EAF5EE; --color-success-border: #9FE1CB;
  --color-success-base: #1D9E75; --color-success-text: #0F6E56; --color-success-deep: #085041;

  /* Warning */
  --color-warning-bg: #FAEEDA; --color-warning-border: #FAC775;
  --color-warning-base: #EF9F27; --color-warning-text: #BA7517; --color-warning-deep: #633806;

  /* Info */
  --color-info-bg: #E6F1FB; --color-info-border: #B5D4F4;
  --color-info-base: #378ADD; --color-info-text: #185FA5; --color-info-deep: #0C447C;
}
```

**Usage rules**
- Primary green → CTAs, nav active, links, vetting badge border
- Secondary gold → star ratings, vetting badge fill, highlight chips
- Tertiary blue → info banners, secondary actions, inquiry status
- Neutral 900 → headings and body text · 700 → secondary text · 500 → placeholder
- Surface bg `#F7F6F2` → page background — never pure white
- Never use colour alone to convey meaning — pair with text or icon

---

## Tailwind Config

```typescript
// tailwind.config.ts — extend theme with token values above
colors: {
  primary:   { base: '#1A6B3C', hover: '#1D9E75', tint: '#EAF5EE', deep: '#085041' },
  secondary: { base: '#D4801A', hover: '#EF9F27', tint: '#FAEEDA', deep: '#633806' },
  tertiary:  { base: '#185FA5', hover: '#378ADD', tint: '#E6F1FB', deep: '#0C447C' },
  neutral:   { 900: '#1A1A1A', 700: '#444441', 500: '#888780', 0: '#FFFFFF' },
  surface:   { bg: '#F7F6F2', border: '#ECEAE3', input: '#D3D1C7', disabled: '#B4B2A9' },
  error:     { bg: '#FCEBEB', border: '#F7C1C1', base: '#E24B4A', text: '#A32D2D', deep: '#791F1F' },
  success:   { bg: '#EAF5EE', border: '#9FE1CB', base: '#1D9E75', text: '#0F6E56', deep: '#085041' },
  warning:   { bg: '#FAEEDA', border: '#FAC775', base: '#EF9F27', text: '#BA7517', deep: '#633806' },
  info:      { bg: '#E6F1FB', border: '#B5D4F4', base: '#378ADD', text: '#185FA5', deep: '#0C447C' },
},
borderRadius: { component: '8px', card: '12px', pill: '9999px' },
fontSize: {
  display:  ['32px', { lineHeight: '1.2', fontWeight: '500' }],
  heading:  ['24px', { lineHeight: '1.3', fontWeight: '500' }],
  subhead:  ['18px', { lineHeight: '1.4', fontWeight: '500' }],
  body:     ['16px', { lineHeight: '1.7', fontWeight: '400' }],
  small:    ['14px', { lineHeight: '1.6', fontWeight: '400' }],
  caption:  ['12px', { lineHeight: '1.5', fontWeight: '400' }],
  overline: ['11px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.08em' }],
},
```

---

## Typography

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| display | 32px | 500 | Page titles |
| heading | 24px | 500 | Section headings |
| subhead | 18px | 500 | Card titles, labels |
| body | 16px | 400 | All body copy |
| small | 14px | 400 | Secondary info, meta |
| caption | 12px | 400 | Timestamps, badges |
| overline | 11px | 500 | Category labels |

- Max weight: 500 — never 600 or 700
- Sentence case only — never ALL CAPS or Title Case
- Font stack: `Inter, system-ui, -apple-system, sans-serif`
- Currency: `₦` always — never `NGN` in UI copy

---

## Spacing, Border and Shadow

**Spacing** — Tailwind default scale:
`space-1` 4px · `space-2` 8px · `space-3` 12px · `space-4` 16px (mobile card padding)
`space-6` 24px (desktop card padding) · `space-8` 32px (section gap) · `space-12` 48px (page sections)

**Border** — always `0.5px` · never `1px`
**Card shadow** — `shadow-sm`: `0 1px 4px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)`
**Elevated shadow** (modals) — `0 8px 24px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06)`

---

## Component Patterns

### Button variants

```tsx
// Primary
className="bg-primary-base hover:bg-primary-hover active:bg-primary-deep
  text-white font-medium text-body px-5 py-3 rounded-component
  min-h-[44px] transition-colors duration-150
  disabled:bg-surface-disabled disabled:cursor-not-allowed"

// Secondary (outline)
className="border border-primary-base text-primary-base hover:bg-primary-tint
  font-medium text-body px-5 py-3 rounded-component min-h-[44px] transition-colors"

// Ghost
className="text-primary-base hover:bg-primary-tint font-medium text-body
  px-4 py-2 rounded-component min-h-[44px] transition-colors"

// Danger
className="bg-error-base hover:bg-error-deep text-white font-medium text-body
  px-5 py-3 rounded-component min-h-[44px] transition-colors"
```

### Input

```tsx
className="w-full bg-neutral-0 border border-surface-input rounded-component px-4 py-3
  text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px]
  focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base
  disabled:bg-surface-bg disabled:cursor-not-allowed"

// Error state — add: border-error-base ring-1 ring-error-base bg-error-bg
```

### Form field

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-small font-medium text-neutral-700">
    Label <span className="text-error-base" aria-hidden="true">*</span>
  </label>
  <input ... />
  {error && <p className="text-caption text-error-text" role="alert">⚠ {error}</p>}
</div>
```

### Badge / Chip

```tsx
// Verified
className="inline-flex items-center gap-1 bg-secondary-tint text-secondary-deep
  text-caption font-medium px-2.5 py-1 rounded-pill"

// Available
className="inline-flex items-center gap-1 bg-primary-tint text-primary-deep
  text-caption font-medium px-2.5 py-1 rounded-pill"

// Unavailable
className="inline-flex items-center gap-1 bg-surface-bg text-neutral-500
  text-caption font-medium px-2.5 py-1 rounded-pill"
```

### Status Banner

```tsx
const styles = {
  error:   'bg-error-bg   border-l-4 border-error-base   text-error-deep',
  success: 'bg-success-bg border-l-4 border-success-base text-success-deep',
  warning: 'bg-warning-bg border-l-4 border-warning-base text-warning-deep',
  info:    'bg-info-bg    border-l-4 border-info-base    text-info-deep',
};
// <div className={`${styles[variant]} px-4 py-3 rounded-component text-small`} role="alert">
```

### Card
```tsx
className="bg-neutral-0 border border-surface-border rounded-card shadow-sm p-4 md:p-6"
```

### Skeleton Loader
```tsx
// Preferred over spinner for content-heavy views
<div className="animate-pulse">
  <div className="h-4 bg-surface-border rounded w-3/4 mb-2" />
  <div className="h-4 bg-surface-border rounded w-1/2" />
</div>
```

---

## Accessibility Rules

- Touch targets: minimum `44×44px`
- Contrast: WCAG AA — 4.5:1 body text, 3:1 large text
- All images: descriptive `alt` — never empty unless decorative
- All inputs: associated `<label>` — never use placeholder as label substitute
- Error messages: `role="alert"`
- Interactive elements: keyboard navigable — never remove `focus:outline` without replacing it
- Never `tabindex > 0` · modals trap focus · icon-only buttons need `aria-label`

---

## Mobile-First Rules

- Mobile styles first — override at `md:` and `lg:`
- Grid: 1 col (mobile) → 2 (md) → 3 (lg) for provider listings
- Page padding: `px-4` → `px-6` → `px-8`
- Max content width: `max-w-6xl mx-auto`
- Navigation: bottom nav (mobile) → top nav (desktop)

---

## Empty States

Every list view must have an empty state — never a blank screen:

| Context | Icon | Title | Description |
|---------|------|-------|-------------|
| Search no results | 🔍 | No providers found | Try a different trade or location |
| No reviews | ⭐ | No reviews yet | Be the first to leave a review |
| No inquiries | 💬 | No messages yet | Your inquiries will appear here |
| No notifications | 🔔 | You're all caught up | Notifications will appear here |

---

## Page Layout Shell

```tsx
<main className="min-h-screen bg-surface-bg">
  <Navbar />
  <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">{children}</div>
  <Footer />
</main>
```

---

## Open Graph (Provider Profile)

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const provider = await getProvider(params.slug);
  return {
    title: `${provider.name} — ${provider.tradeCategory} in ${provider.location} | SabiPro`,
    description: provider.bio?.slice(0, 160) ?? `${provider.name} is a ${provider.tradeCategory} on SabiPro`,
    openGraph: {
      images: [provider.portfolioUrls?.[0] ?? '/og-default.png'],
      url: `https://sabipro.com/providers/${provider.slug}`,
    },
  };
}
```

Meta tags must be server-rendered — never injected client-side.

---

## Admin Dashboard Design

Same tokens, distinct layout — persistent dark sidebar, data-dense content area.

**Colours**
- Sidebar bg: `neutral-900` · text: `neutral-0` · active item: `primary-base` left border + `primary-tint` bg
- Page bg: `surface-bg` · stat cards: `neutral-0` with `surface-border`

**Stat card**
```tsx
<div className="bg-neutral-0 border border-surface-border rounded-card p-5">
  <p className="text-overline text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
  <p className="text-display font-medium text-neutral-900">{value}</p>
  {trend && <p className={`text-small mt-1 ${trend > 0 ? 'text-success-text' : 'text-error-text'}`}>
    {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% this month
  </p>}
</div>
```

**Table** — `bg-neutral-0 border border-surface-border rounded-card overflow-hidden`
· thead: `bg-surface-bg border-b border-surface-border`
· tbody rows: `hover:bg-surface-bg transition-colors divide-y divide-surface-border`

**Action buttons**
```
Approve  → text-primary-base hover:bg-primary-tint
Suspend  → text-error-text   hover:bg-error-bg
Dismiss  → text-neutral-500  hover:bg-surface-bg
```
All: `text-caption font-medium px-3 py-1.5 rounded-component transition-colors`

**Sidebar** — `w-60 min-h-screen bg-neutral-900`
· Active nav item: `bg-primary-tint text-primary-base border-l-2 border-primary-base`
· Inactive: `text-neutral-500 hover:text-neutral-0 hover:bg-neutral-700`
· Pending badge: `bg-error-base text-white text-caption px-1.5 py-0.5 rounded-pill`

---

## Exclusions

- No dark mode (post-MVP)
- No animation library — CSS transitions only
- No component library (Shadcn, MUI) — Tailwind primitives only
- Custom fonts optional — system stack is fine