# Gas Sponsorship Database Migration Guide

## Overview

This guide explains how to apply the database schema changes for gas sponsorship transaction tracking.

## What's Been Added

### New Database Model: `GasSponsoredTransaction`

This model tracks all gas-sponsored transactions to enable:

- **Rate limiting**: Enforce per-user daily transaction limits
- **Cost monitoring**: Track actual gas costs over time
- **Usage analytics**: Generate metrics for the admin dashboard
- **Audit trail**: Complete history of sponsored transactions

### Schema Details

```prisma
model GasSponsoredTransaction {
  id              Int      @id @default(autoincrement())

  // User who made the transaction
  userId          Int
  userAddress     String   // Wallet address of user

  // Transaction details
  method          String   // submitVenue, rsvpToEvent, etc.
  transactionHash String   @unique
  blockNumber     Int?

  // Cost tracking (estimated)
  gasUsed         Int?
  gasCostUSD      Float?
  gasCostCELO     Float?

  // Context
  relatedEntityId Int?     // ID of related venue/event
  relatedEntityType String? // "venue", "event", "profile"

  // Rate limiting
  dailyCount      Int      @default(1)

  // Status
  status          GasTransactionStatus @default(CONFIRMED)
  errorMessage    String?

  // Timestamps
  createdAt       DateTime @default(now())
  processedAt     DateTime?

  @@index([userId, createdAt])
  @@index([userAddress, createdAt])
  @@index([method, createdAt])
  @@index([transactionHash])
  @@index([createdAt])
}

enum GasTransactionStatus {
  PENDING
  CONFIRMED
  FAILED
  REFUNDED
}
```

---

## Migration Steps

### Step 1: Review the Schema

The schema has been added to `prisma/schema.prisma`. Review the changes:

```bash
git diff prisma/schema.prisma
```

### Step 2: Create Migration

Generate a new Prisma migration:

```bash
npx prisma migrate dev --name add-gas-sponsored-transaction-tracking
```

This will:

1. Create a new migration file in `prisma/migrations/`
2. Generate the SQL for creating the new table
3. Apply the migration to your development database
4. Regenerate the Prisma client

### Step 3: Verify Migration

After running the migration, verify it was successful:

```bash
# Check migration status
npx prisma migrate status

# Verify the table exists
npx prisma studio
# → Navigate to GasSponsoredTransaction model
```

### Step 4: Deploy to Production (When Ready)

When you're ready to deploy to production:

```bash
# In your deployment pipeline or manually
npx prisma migrate deploy
```

**Note:** On Vercel, migrations run automatically on deployment if you have the build command configured.

---

## Usage After Migration

### Recording a Sponsored Transaction

When a transaction is sponsored, record it in the database:

```typescript
import prisma from '@/lib/prisma'

async function recordSponsoredTransaction(
  userId: number,
  userAddress: string,
  method: string,
  transactionHash: string,
  relatedEntityId?: number,
  relatedEntityType?: string
) {
  await prisma.gasSponsoredTransaction.create({
    data: {
      userId,
      userAddress,
      method,
      transactionHash,
      relatedEntityId,
      relatedEntityType,
      status: 'CONFIRMED',
    },
  })
}
```

### Checking Rate Limits

Check if a user has exceeded their daily limit:

```typescript
import { startOfDay } from 'date-fns'
import { sponsorshipPolicies } from '@/lib/gas-sponsorship'

async function checkRateLimit(userAddress: string, method: string): Promise<boolean> {
  const today = startOfDay(new Date())
  const limit = sponsorshipPolicies.rateLimits[method]

  if (!limit) {
    return false // Method not rate limited
  }

  const count = await prisma.gasSponsoredTransaction.count({
    where: {
      userAddress,
      method,
      createdAt: {
        gte: today,
      },
      status: 'CONFIRMED',
    },
  })

  return count >= limit
}
```

### Fetching Metrics for Dashboard

Get transaction metrics for the admin dashboard:

```typescript
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'

async function getGasMetrics() {
  const today = startOfDay(new Date())
  const weekStart = startOfWeek(new Date())
  const monthStart = startOfMonth(new Date())

  // Today's transactions
  const todayTxs = await prisma.gasSponsoredTransaction.findMany({
    where: {
      createdAt: { gte: today },
      status: 'CONFIRMED',
    },
  })

  // Week's transactions
  const weekTxs = await prisma.gasSponsoredTransaction.findMany({
    where: {
      createdAt: { gte: weekStart },
      status: 'CONFIRMED',
    },
  })

  // Month's transactions
  const monthTxs = await prisma.gasSponsoredTransaction.findMany({
    where: {
      createdAt: { gte: monthStart },
      status: 'CONFIRMED',
    },
  })

  // Calculate costs
  const costToday = todayTxs.reduce((sum, tx) => sum + (tx.gasCostUSD || 0), 0)
  const costWeek = weekTxs.reduce((sum, tx) => sum + (tx.gasCostUSD || 0), 0)
  const costMonth = monthTxs.reduce((sum, tx) => sum + (tx.gasCostUSD || 0), 0)

  // Group by transaction type
  const transactionsByType = monthTxs.reduce(
    (acc, tx) => {
      acc[tx.method] = (acc[tx.method] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Top users
  const userStats = monthTxs.reduce(
    (acc, tx) => {
      if (!acc[tx.userAddress]) {
        acc[tx.userAddress] = { count: 0, cost: 0 }
      }
      acc[tx.userAddress].count++
      acc[tx.userAddress].cost += tx.gasCostUSD || 0
      return acc
    },
    {} as Record<string, { count: number; cost: number }>
  )

  const topUsers = Object.entries(userStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  return {
    totalTransactionsToday: todayTxs.length,
    totalTransactionsWeek: weekTxs.length,
    totalTransactionsMonth: monthTxs.length,
    costToday,
    costWeek,
    costMonth,
    transactionsByType,
    topUsers,
  }
}
```

---

## Integration Points

### Where to Add Transaction Recording

Add transaction recording in the following places:

1. **Venue Submission** (`app/submit/page.tsx`)
   - After successful `submitVenue` transaction
   - Record with `method: 'submitVenue'` and `relatedEntityId: venueId`

2. **Event RSVP** (`app/events/[id]/page.tsx`)
   - After successful RSVP transaction
   - Record with `method: 'rsvpToEvent'` and `relatedEntityId: eventId`

3. **Profile Update** (`app/profile/edit/page.tsx`)
   - After successful profile update transaction
   - Record with `method: 'updateProfile'` and `relatedEntityId: userId`

4. **Event Creation** (`app/events/create/page.tsx`)
   - After successful event creation transaction
   - Record with `method: 'createEvent'` and `relatedEntityId: eventId`

5. **Venue Verification** (`app/curator/page.tsx`)
   - After successful verification transaction
   - Record with `method: 'verifyVenue'` and `relatedEntityId: venueId`

### Example Integration

```typescript
// In venue submission form
async function submitVenue(venueData: VenueFormData) {
  try {
    // 1. Submit transaction to blockchain
    const tx = await contract.submitVenue(venueData)
    await tx.wait()

    // 2. Save venue to database
    const venue = await fetch('/api/venues', {
      method: 'POST',
      body: JSON.stringify(venueData),
    }).then((res) => res.json())

    // 3. Record sponsored transaction
    if (process.env.NEXT_PUBLIC_PAYMASTER_URL) {
      await fetch('/api/admin/gas-transactions', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          userAddress: user.walletAddress,
          method: 'submitVenue',
          transactionHash: tx.hash,
          relatedEntityId: venue.id,
          relatedEntityType: 'venue',
        }),
      })
    }

    return venue
  } catch (error) {
    console.error('Error submitting venue:', error)
    throw error
  }
}
```

---

## Monitoring & Maintenance

### Daily Tasks

1. **Check dashboard**: Visit `/admin/gas-sponsorship` to review daily costs
2. **Monitor alerts**: Watch for budget threshold warnings
3. **Review top users**: Check for unusual patterns

### Weekly Tasks

1. **Analyze trends**: Review weekly transaction volumes
2. **Update rate limits**: Adjust limits in `lib/gas-sponsorship.ts` if needed
3. **Check Pimlico balance**: Ensure sufficient funds

### Monthly Tasks

1. **Review budget**: Compare actual costs to projections
2. **Optimize policies**: Adjust sponsored methods based on usage
3. **Clean old data**: Archive or delete old transaction records (optional)

---

## Troubleshooting

### Migration Fails

**Error: "Table already exists"**

- The migration may have already been applied
- Run `npx prisma migrate status` to check
- If stuck, run `npx prisma migrate resolve --applied <migration_name>`

**Error: "Cannot connect to database"**

- Check `DATABASE_URL` in `.env`
- Ensure database is running
- Verify credentials

### Transaction Recording Fails

**Error: "User not found"**

- Ensure user exists in database before recording transaction
- Create user profile on first transaction if needed

**Error: "Duplicate transaction hash"**

- Transaction may have already been recorded
- Check if transaction hash exists before inserting
- Use `upsert` instead of `create` if needed

---

## Next Steps

After applying the migration:

1. ✅ Database schema is ready
2. ⏳ Implement transaction recording in UI components
3. ⏳ Update `/api/admin/gas-metrics` to use real data
4. ⏳ Add rate limit checks before transactions
5. ⏳ Set up automated cost calculation (from Pimlico API)

---

**Created:** 2025-12-28
**Status:** Migration Ready
**Impact:** Adds 1 table, 1 enum, 5 indexes
