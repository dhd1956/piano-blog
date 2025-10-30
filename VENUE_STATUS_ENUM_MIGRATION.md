# Venue Status Enum Migration Plan

**Date:** 2025-10-29
**Priority:** HIGH - Should be done before Sprint 2 implementation

---

## Current Implementation (3-State via Boolean + Nullable)

### Current Schema

```prisma
model Venue {
  verified     Boolean   @default(false)
  verifiedAt   DateTime?
  rejectedAt   DateTime?
  rejectedBy   String?
  rejectionReason String? @db.Text
}
```

### Current Status Logic (in components)

```typescript
const isRejected = venue.rejectedAt !== null
const statusText = venue.verified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Verification'
```

**This gives 3 states:**

1. **VERIFIED** - `verified = true`
2. **REJECTED** - `verified = false AND rejectedAt !== null`
3. **PENDING** - `verified = false AND rejectedAt === null`

---

## Recommended Implementation (Enum)

### Proposed Schema

```prisma
model Venue {
  // Replace verified Boolean with status enum
  status          VenueStatus @default(PENDING)

  // Keep timestamp fields for audit trail
  verifiedAt      DateTime?
  rejectedAt      DateTime?
  rejectedBy      String?
  rejectionReason String?   @db.Text

  // ... other fields
}

enum VenueStatus {
  PENDING    // Submitted, awaiting verification
  VERIFIED   // Approved by blog owner or 3 validators
  REJECTED   // Rejected by curator
  FLAGGED    // Optional: Flagged for review
  ARCHIVED   // Optional: Archived/removed
}
```

---

## Migration Steps

### Step 1: Add VenueStatus Enum to Schema

**File:** `/prisma/schema.prisma`

Add enum at bottom of file:

```prisma
enum VenueStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

### Step 2: Add status Field to Venue Model

```prisma
model Venue {
  // ... existing fields ...

  // NEW: Status enum (replaces verified boolean logic)
  status          VenueStatus @default(PENDING)

  // Keep for backwards compatibility during migration
  verified        Boolean     @default(false)

  // Keep these for audit trail
  verifiedAt      DateTime?
  rejectedAt      DateTime?
  rejectedBy      String?
  rejectionReason String?   @db.Text

  // ... rest of fields ...
}
```

### Step 3: Create Migration with Data Backfill

```bash
npx prisma migrate dev --name add_venue_status_enum
```

After migration creates the column, backfill existing data:

**File:** `/prisma/migrations/XXXXXX_add_venue_status_enum/migration.sql`

Add this after the ALTER TABLE statements:

```sql
-- Backfill status based on existing data
UPDATE "Venue"
SET status = CASE
  WHEN verified = true THEN 'VERIFIED'::"VenueStatus"
  WHEN "rejectedAt" IS NOT NULL THEN 'REJECTED'::"VenueStatus"
  ELSE 'PENDING'::"VenueStatus"
END;
```

### Step 4: Update API Routes

**File:** `/app/api/venues/[id]/route.ts`

```typescript
// OLD CODE
if (body.verified !== undefined) {
  updateData.verified = body.verified
  if (body.verified === true) {
    updateData.verifiedAt = new Date()
    updateData.rejectedAt = null
    updateData.rejectedBy = null
    updateData.rejectionReason = null
  }
}

// NEW CODE
if (body.status !== undefined) {
  updateData.status = body.status // VenueStatus enum

  if (body.status === 'VERIFIED') {
    updateData.verifiedAt = new Date()
    updateData.rejectedAt = null
    updateData.rejectedBy = null
    updateData.rejectionReason = null
    updateData.verified = true // Keep for backwards compat
  } else if (body.status === 'REJECTED') {
    if (!body.rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
    }
    updateData.rejectedAt = new Date()
    updateData.rejectedBy = user.walletAddress
    updateData.rejectionReason = body.rejectionReason
    updateData.verifiedAt = null
    updateData.verified = false // Keep for backwards compat
  } else if (body.status === 'PENDING') {
    updateData.verifiedAt = null
    updateData.rejectedAt = null
    updateData.rejectedBy = null
    updateData.rejectionReason = null
    updateData.verified = false // Keep for backwards compat
  }
}
```

### Step 5: Update Components

**File:** `/components/VenueDetailsView.tsx`

```typescript
// OLD CODE
const isRejected = venue.rejectedAt !== null
const statusText = venue.verified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Verification'

// NEW CODE (much simpler!)
const statusText = {
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  PENDING: 'Pending Verification',
  FLAGGED: 'Flagged for Review',
  ARCHIVED: 'Archived',
}[venue.status]

const statusColor = {
  VERIFIED: 'text-green-600',
  REJECTED: 'text-red-600',
  PENDING: 'text-yellow-600',
  FLAGGED: 'text-orange-600',
  ARCHIVED: 'text-gray-600',
}[venue.status]
```

**File:** `/app/curator/page.tsx`

```typescript
// Update approval/rejection logic
const handleApprove = async () => {
  const response = await fetch(`/api/venues/${venueId}?address=${walletAddress}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'VERIFIED', // Use enum value
    }),
  })
}

const handleReject = async () => {
  const response = await fetch(`/api/venues/${venueId}?address=${walletAddress}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'REJECTED', // Use enum value
      rejectionReason: verificationNotes,
    }),
  })
}
```

### Step 6: Update TypeScript Types

**File:** `/types/venue.ts`

```typescript
export type VenueStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED' | 'ARCHIVED'

export interface Venue {
  id: number
  // ... other fields ...

  // NEW: Status enum
  status: VenueStatus

  // DEPRECATED: Keep for backwards compatibility
  verified?: boolean

  // Audit fields
  verifiedAt?: Date | null
  rejectedAt?: Date | null
  rejectedBy?: string | null
  rejectionReason?: string | null
}
```

### Step 7: Update Queries

**File:** `/lib/database-simplified.ts` or any file with venue queries

```typescript
// OLD: Filter by verified boolean
const verifiedVenues = await prisma.venue.findMany({
  where: { verified: true },
})

// NEW: Filter by status enum
const verifiedVenues = await prisma.venue.findMany({
  where: { status: 'VERIFIED' },
})

// Get all non-rejected venues
const activeVenues = await prisma.venue.findMany({
  where: {
    status: { in: ['PENDING', 'VERIFIED'] },
  },
})
```

---

## Benefits of Enum Approach

### 1. **Clearer Code**

```typescript
// Instead of this:
if (venue.verified === false && venue.rejectedAt !== null) { ... }

// You get this:
if (venue.status === 'REJECTED') { ... }
```

### 2. **Type Safety**

```typescript
// TypeScript will catch typos
venue.status = 'VERIFED' // Error: Did you mean 'VERIFIED'?
```

### 3. **Extensibility**

Easy to add new states without changing Boolean logic:

- `FLAGGED` - Venue flagged for curator review
- `ARCHIVED` - Venue permanently removed
- `UNDER_REVIEW` - Being validated by community

### 4. **Database Constraints**

PostgreSQL enforces valid enum values at the database level

### 5. **Simpler Queries**

```sql
-- Get all pending venues
SELECT * FROM "Venue" WHERE status = 'PENDING';

-- Much clearer than:
SELECT * FROM "Venue" WHERE verified = false AND "rejectedAt" IS NULL;
```

---

## Backwards Compatibility Plan

### Phase 1: Dual-Write (Migration Period)

Keep both `verified` boolean and `status` enum, write to both:

```typescript
// Update both fields during migration
updateData.status = 'VERIFIED'
updateData.verified = true // Keep in sync
```

### Phase 2: Deprecate Boolean (After Testing)

After confirming all code uses `status` enum:

1. Remove `verified` boolean field
2. Remove backwards compatibility writes
3. Update indexes to use `status` instead of `verified`

---

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Existing venues backfilled with correct status
- [ ] Curator can approve venues (status → VERIFIED)
- [ ] Curator can reject venues (status → REJECTED)
- [ ] Pending venues show status = PENDING
- [ ] VenueDetailsView shows correct status badge
- [ ] Curator page filters work with new enum
- [ ] Venue list filters work with new enum
- [ ] TypeScript types updated
- [ ] No console errors
- [ ] Database queries optimized for enum

---

## Rollback Plan

If migration fails:

```bash
# Revert migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Or manually:
ALTER TABLE "Venue" DROP COLUMN status;
DROP TYPE "VenueStatus";
```

---

## Recommended Timeline

**Before Sprint 2 starts:**

1. Create enum and add status field (1 hour)
2. Run migration with backfill (30 min)
3. Update API routes (1 hour)
4. Update components (1 hour)
5. Test all verification flows (1 hour)
6. **Total: ~4.5 hours**

This should be done **BEFORE** implementing WPB-3 democratic verification to avoid conflicts.

---

**Last Updated:** 2025-10-29
**Status:** RECOMMENDED for immediate implementation
