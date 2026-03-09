# Plan: Stripe Integration + Freemium Model

## Context

The platform currently has no monetisation. All features are free. The user wants to introduce real-money payments via Stripe to support: featured/promoted listings (one-off), a Venue Owner subscription, and a Musician Pro subscription. No Stripe code, schema fields, or environment variables exist yet — this is greenfield.

## Recommended Freemium Boundary

|                                         | Free (Scout) | Musician Pro ~$8.99 CAD/mo | Venue Owner ~$12.99 CAD/mo |
| --------------------------------------- | ------------ | -------------------------- | -------------------------- |
| Browse venues, events                   | ✅           | ✅                         | ✅                         |
| Submit a venue                          | ✅           | ✅                         | ✅                         |
| RSVP to events                          | ✅           | ✅                         | ✅                         |
| Basic profile + PXP rewards             | ✅           | ✅                         | ✅                         |
| Musicians directory listing             | ✅           | ✅                         | ✅                         |
| **Priority placement in musicians dir** | ❌           | ✅                         | —                          |
| **Verified musician badge**             | ❌           | ✅                         | —                          |
| **Profile analytics** (who viewed)      | ❌           | ✅                         | —                          |
| **Booking inquiry form** on profile     | ❌           | ✅                         | —                          |
| **Claim & edit a venue listing**        | ❌           | —                          | ✅                         |
| **VenueAnalytics dashboard**            | ❌           | —                          | ✅                         |
| **Post events** for venue               | ❌           | —                          | ✅                         |
| **Featured badge** on venue             | ❌           | —                          | ✅                         |

**One-off promoted listings** (separate from subscriptions):

- Venue spotlight: $12 CAD / 7 days
- Event promotion: $6 CAD / 7 days
- Musician featured slot: $18 CAD / 30 days

---

## Architecture

### Stripe Products (created in Stripe dashboard)

- **musician_pro** — Monthly recurring (~$8.99 CAD)
- **venue_owner** — Monthly recurring (~$12.99 CAD)
- One-off prices for venue spotlight, event promo, musician featured

### Stripe Events we handle

- `checkout.session.completed` — activate subscription or featured listing
- `customer.subscription.updated` — update tier/status on renewal
- `customer.subscription.deleted` — downgrade to free on cancellation
- `invoice.payment_failed` — optionally notify user, flag status

---

## Implementation Steps

### Step 1: Schema changes (`prisma/schema.prisma`)

Add to **User** model:

```prisma
stripeCustomerId    String?   @unique
subscriptionTier    SubscriptionTier @default(FREE)
subscriptionStatus  String?   // "active" | "past_due" | "canceled"
subscriptionEndsAt  DateTime?
```

Add to **Venue** model:

```prisma
ownerId      Int?      // FK to User (claimed by venue owner subscriber)
owner        User?     @relation(fields: [ownerId], references: [id])
isFeatured   Boolean   @default(false)
featuredUntil DateTime?
```

Add **SubscriptionTier** enum:

```prisma
enum SubscriptionTier {
  FREE
  MUSICIAN_PRO
  VENUE_OWNER
}
```

Add **StripePayment** model (audit trail):

```prisma
model StripePayment {
  id                Int      @id @default(autoincrement())
  userId            Int
  user              User     @relation(...)
  stripeSessionId   String   @unique
  stripePaymentIntentId String?
  amount            Int      // pence
  currency          String   @default("cad")
  type              String   // "subscription" | "featured_venue" | "featured_event" | "featured_musician"
  status            String   // "pending" | "completed" | "refunded"
  metadata          Json?
  createdAt         DateTime @default(now())
}
```

### Step 2: Install Stripe SDK

```
yarn add stripe @stripe/stripe-js
```

### Step 3: Environment variables

Add to `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_MUSICIAN_PRO_PRICE_ID=price_...
STRIPE_VENUE_OWNER_PRICE_ID=price_...
```

### Step 4: Server-side Stripe client (`lib/stripe.ts`)

Singleton Stripe instance using `STRIPE_SECRET_KEY`. Pattern mirrors existing `lib/get-db.ts`.

### Step 5: API routes

**`POST /api/stripe/create-checkout`**

- Auth: requires valid JWT
- Body: `{ type: 'musician_pro' | 'venue_owner' | 'featured_venue' | 'featured_event', metadata?: {} }`
- Creates or retrieves Stripe Customer (upsert via `stripeCustomerId`)
- Creates Checkout Session (subscription or payment mode)
- Returns `{ url }` to redirect client to Stripe-hosted checkout
- `success_url` and `cancel_url` point back to the app

**`POST /api/stripe/webhook`** (no auth — uses Stripe signature verification)

- Reads raw body, verifies signature with `STRIPE_WEBHOOK_SECRET`
- Handles:
  - `checkout.session.completed` → update DB (tier, status, payment record)
  - `customer.subscription.updated` → sync status/tier
  - `customer.subscription.deleted` → reset to FREE
  - `invoice.payment_failed` → set `subscriptionStatus = 'past_due'`

**`POST /api/stripe/portal`**

- Auth: requires JWT
- Creates Stripe Billing Portal session for customer to manage their own subscription
- Returns `{ url }` to redirect to portal

### Step 6: Feature gates (`lib/subscription.ts`)

```typescript
export function isMusicianPro(user: {
  subscriptionTier: SubscriptionTier
  subscriptionStatus?: string | null
}): boolean
export function isVenueOwner(user: {
  subscriptionTier: SubscriptionTier
  subscriptionStatus?: string | null
}): boolean
```

Check tier = correct enum AND status = 'active' (or null for subscription-free states).

### Step 7: Pricing page (`app/pricing/page.tsx`)

Static page showing:

- Free / Musician Pro / Venue Owner cards with feature lists
- CTA buttons → `POST /api/stripe/create-checkout` → redirect to Stripe
- "Manage subscription" button → `POST /api/stripe/portal`

### Step 8: Gate features in existing pages

- `app/musicians/page.tsx` — Pro users sorted to top; Pro badge shown
- `app/profile/[address]/page.tsx` — Show analytics card if `isMusicianPro`
- `app/venueDetails/[id]/page.tsx` — Edit button visible if `isVenueOwner` and `venue.ownerId === user.id`
- `app/api/venues/[id]/route.ts` — PATCH only allowed if blog_owner OR (venue_owner tier AND ownerId matches)

### Step 9: next.config.js CSP

Add Stripe JS domains to `connect-src` and `script-src`:

```
https://js.stripe.com
https://hooks.stripe.com
```

---

## Critical Files

| File                                      | Action                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                    | Add SubscriptionTier enum, User fields, Venue fields, StripePayment model             |
| `lib/stripe.ts`                           | Create — Stripe singleton                                                             |
| `lib/subscription.ts`                     | Create — feature gate helpers                                                         |
| `app/api/stripe/create-checkout/route.ts` | Create                                                                                |
| `app/api/stripe/webhook/route.ts`         | Create — requires `export const config = { api: { bodyParser: false } }` for raw body |
| `app/api/stripe/portal/route.ts`          | Create                                                                                |
| `app/pricing/page.tsx`                    | Create                                                                                |
| `next.config.js`                          | Add Stripe CSP domains                                                                |
| `app/venueDetails/[id]/page.tsx`          | Gate edit button on venue ownership                                                   |
| `app/musicians/page.tsx`                  | Sort/badge Pro musicians                                                              |

---

## Key Decisions

- **Stripe-hosted checkout**: No PCI scope, no card form to build. Users redirect to Stripe, then return.
- **Webhook is the source of truth**: Never trust the client redirect — only activate features after webhook confirms payment.
- **Venue claiming**: First Venue Owner subscriber to click "Claim" on a venue gets `ownerId`. If already claimed, show "Contact venue owner". Max 1 owner per venue.
- **PXP spending stays separate**: Featured listings can be purchased with real money OR (future) PXP. This plan covers real money only.
- **No trial period initially**: Start simple. Stripe supports adding trials later without code changes.

---

## Verification

1. Install stripe, add env vars, run `prisma migrate dev`
2. Create a test Stripe checkout session, redirect to Stripe test mode, complete payment
3. Verify webhook fires → DB `subscriptionTier` updated
4. Log in as upgraded user → confirm Pro features visible, free user cannot see them
5. Go to billing portal → cancel subscription → tier resets to FREE after webhook
6. Test featured venue purchase → `isFeatured=true`, `featuredUntil` set correctly
