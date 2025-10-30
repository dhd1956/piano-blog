# Venue Status Enum Migration - Direct Approach

**Date:** 2025-10-29
**Environment:** Pre-production (localhost + Vercel IST)
**Approach:** Direct migration, no backwards compatibility needed

---

## Why Simple Migration Works Here

- ✅ **Not in production** - No live users affected
- ✅ **Only localhost + Vercel IST** - Can easily rebuild/redeploy
- ✅ **Small dataset** - Can backfill quickly
- ❌ **No need for dual-write** - Not serving production traffic

---

## Direct Migration Steps

### Step 1: Add VenueStatus Enum to Schema

**File:** `/prisma/schema.prisma`

Add at the bottom (after other enums):

```prisma
enum VenueStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

### Step 2: Replace verified Boolean with status Enum

**File:** `/prisma/schema.prisma`

```prisma
model Venue {
  // ... existing fields ...

  // REMOVE THIS LINE:
  // verified     Boolean  @default(false)

  // ADD THIS LINE:
  status       VenueStatus @default(PENDING)

  // Keep audit trail fields
  verifiedAt   DateTime?
  rejectedAt   DateTime?
  rejectedBy   String?
  rejectionReason String? @db.Text

  // ... rest of fields ...
}
```

Update indexes:

```prisma
// CHANGE:
@@index([city, verified])
@@index([hasPiano, verified])

// TO:
@@index([city, status])
@@index([hasPiano, status])
```

### Step 3: Create Migration with Backfill

```bash
npx prisma migrate dev --name replace_verified_with_status_enum
```

When Prisma asks "Do you want to continue? Some data will be lost", say **YES** (we'll backfill).

### Step 4: Manually Edit the Migration SQL

**File:** `/prisma/migrations/XXXXXX_replace_verified_with_status_enum/migration.sql`

Prisma will generate something like:

```sql
-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "verified",
ADD COLUMN "status" "VenueStatus" NOT NULL DEFAULT 'PENDING';
```

**Replace with this** (to preserve data):

```sql
-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Add new column first (nullable during migration)
ALTER TABLE "Venue" ADD COLUMN "status" "VenueStatus";

-- Backfill data from existing fields
UPDATE "Venue"
SET status = CASE
  WHEN verified = true THEN 'VERIFIED'::"VenueStatus"
  WHEN "rejectedAt" IS NOT NULL THEN 'REJECTED'::"VenueStatus"
  ELSE 'PENDING'::"VenueStatus"
END;

-- Make status non-nullable now that it's populated
ALTER TABLE "Venue" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Venue" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"VenueStatus";

-- Drop old verified column
ALTER TABLE "Venue" DROP COLUMN "verified";

-- Update indexes
DROP INDEX IF EXISTS "Venue_city_verified_idx";
DROP INDEX IF EXISTS "Venue_hasPiano_verified_idx";
CREATE INDEX "Venue_city_status_idx" ON "Venue"("city", "status");
CREATE INDEX "Venue_hasPiano_status_idx" ON "Venue"("hasPiano", "status");
```

### Step 5: Run the Migration

```bash
npx prisma migrate dev
npx prisma generate
```

Restart your dev server:

```bash
# Kill existing yarn dev processes
# Then:
yarn dev
```

---

## Code Updates

### Update API Route

**File:** `/app/api/venues/[id]/route.ts`

```typescript
// FIND THIS SECTION (around line 128):
if (body.verified !== undefined) {
  updateData.verified = body.verified
  if (body.verified === true) {
    updateData.verifiedAt = new Date()
    updateData.rejectedAt = null
    updateData.rejectedBy = null
    updateData.rejectionReason = null
  } else if (body.verified === false) {
    if (!body.rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a venue' },
        { status: 400 }
      )
    }
    updateData.rejectedAt = new Date()
    updateData.rejectedBy = user.walletAddress
    updateData.rejectionReason = body.rejectionReason
    updateData.verifiedAt = null
  }
}

// REPLACE WITH:
if (body.status !== undefined) {
  updateData.status = body.status // VenueStatus enum

  if (body.status === 'VERIFIED') {
    updateData.verifiedAt = new Date()
    updateData.rejectedAt = null
    updateData.rejectedBy = null
    updateData.rejectionReason = null
  } else if (body.status === 'REJECTED') {
    if (!body.rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a venue' },
        { status: 400 }
      )
    }
    updateData.rejectedAt = new Date()
    updateData.rejectedBy = user.walletAddress
    updateData.rejectionReason = body.rejectionReason
    updateData.verifiedAt = null
  } else if (body.status === 'PENDING') {
    // Reset to pending state
    updateData.verifiedAt = null
    updateData.rejectedAt = null
    updateData.rejectedBy = null
    updateData.rejectionReason = null
  }
}
```

### Update Curator Page

**File:** `/app/curator/page.tsx`

```typescript
// FIND:
const response = await fetch(`/api/venues/${venueId}?address=${walletAddress}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verified: approved,
    rejectionReason: !approved ? verificationNotes : undefined,
  }),
})

// REPLACE WITH:
const response = await fetch(`/api/venues/${venueId}?address=${walletAddress}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: approved ? 'VERIFIED' : 'REJECTED',
    rejectionReason: !approved ? verificationNotes : undefined,
  }),
})
```

### Update VenueDetailsView Component

**File:** `/components/VenueDetailsView.tsx`

```typescript
// FIND THIS (around line 170):
const isRejected = venue.rejectedAt !== null && venue.rejectedAt !== undefined
const statusText = venue.verified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Verification'
const statusColor = venue.verified
  ? 'text-green-600'
  : isRejected
    ? 'text-red-600'
    : 'text-yellow-600'

// REPLACE WITH:
const statusText =
  {
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
    PENDING: 'Pending Verification',
  }[venue.status] || 'Unknown'

const statusColor =
  {
    VERIFIED: 'text-green-600',
    REJECTED: 'text-red-600',
    PENDING: 'text-yellow-600',
  }[venue.status] || 'text-gray-600'

const isRejected = venue.status === 'REJECTED'
```

### Update Venue Detail Page

**File:** `/app/venueDetails/[id]/page.tsx`

```typescript
// FIND the processedVenue object and ADD status field:
const processedVenue: Venue = {
  id: venueData.id,
  // ... existing fields ...

  // ADD THIS:
  status: venueData.status,

  // ... rest of fields ...
}
```

### Update TypeScript Types

**File:** `/types/venue.ts`

```typescript
// ADD:
export type VenueStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

// UPDATE Venue interface:
export interface Venue {
  id: number
  // ... other fields ...

  // REMOVE:
  // verified?: boolean

  // ADD:
  status: VenueStatus

  // Keep audit fields:
  verifiedAt?: Date | null
  rejectedAt?: Date | null
  rejectedBy?: string | null
  rejectionReason?: string | null

  // ... rest of fields ...
}
```

---

## Query Updates

### Update any queries using `verified` field

**Search for:**

```bash
grep -r "verified.*true\|verified.*false" --include="*.ts" --include="*.tsx"
```

**Common patterns to update:**

```typescript
// BEFORE:
where: {
  verified: true
}

// AFTER:
where: {
  status: 'VERIFIED'
}
```

```typescript
// BEFORE:
where: {
  verified: false,
  rejectedAt: null
}

// AFTER:
where: { status: 'PENDING' }
```

```typescript
// BEFORE:
where: {
  verified: false,
  rejectedAt: { not: null }
}

// AFTER:
where: { status: 'REJECTED' }
```

---

## Testing Checklist

After migration:

### Database

- [ ] Migration runs without errors
- [ ] All existing venues have correct status
- [ ] Verify in database:
  ```sql
  SELECT id, name, status, "verifiedAt", "rejectedAt" FROM "Venue";
  ```

### API

- [ ] GET /api/venues - Returns venues with status field
- [ ] GET /api/venues/[id] - Returns single venue with status
- [ ] PUT /api/venues/[id] - Can update status to VERIFIED
- [ ] PUT /api/venues/[id] - Can update status to REJECTED (with reason)
- [ ] PUT /api/venues/[id] - Requires rejection reason when rejecting

### UI

- [ ] Curator page shows correct status for all venues
- [ ] Curator can approve venue (status → VERIFIED)
- [ ] Curator can reject venue (status → REJECTED)
- [ ] VenueDetailsView shows correct status badge
- [ ] VERIFIED venues show green badge
- [ ] REJECTED venues show red badge and rejection reason
- [ ] PENDING venues show yellow badge
- [ ] Venue list page filters work

### Dev Tools

- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Prisma Studio shows enum values correctly

---

## Vercel IST Deployment

After testing locally:

1. Commit changes:

   ```bash
   git add .
   git commit -m "feat: Replace verified boolean with VenueStatus enum"
   ```

2. Push to trigger Vercel deployment:

   ```bash
   git push
   ```

3. Vercel will automatically:
   - Run the migration
   - Deploy the new code
   - Your IST environment will be updated

4. Test on Vercel IST URL to confirm migration worked

---

## Rollback Plan

If something goes wrong:

### Localhost

```bash
# Delete the migration file
rm prisma/migrations/XXXXXX_replace_verified_with_status_enum

# Reset database
npx prisma migrate reset

# This will drop all data and re-run all migrations
# (OK since not in production)
```

### Vercel IST

Redeploy previous commit:

```bash
git revert HEAD
git push
```

---

## Estimated Time

- Step 1-2: Schema changes (10 min)
- Step 3-4: Migration SQL editing (15 min)
- Step 5: Run migration (5 min)
- Code updates: API route (10 min)
- Code updates: Components (15 min)
- Code updates: Types (5 min)
- Testing (20 min)
- Deploy to Vercel (10 min)

**Total: ~1.5 hours**

Much faster than the 4.5 hours estimated for dual-write approach!

---

**Last Updated:** 2025-10-29
**Approach:** Direct migration (no dual-write needed)
**Ready to implement:** YES
