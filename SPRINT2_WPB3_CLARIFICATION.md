# WPB-3: Democratic Venue Verification - Implementation Clarification

**Date:** 2025-10-29
**Status:** Ready for Sprint 2 implementation
**Approach:** EXTEND existing verification system, not replace

---

## ✅ What Sprint 1 Already Delivered

### Complete 3-State Verification System

**Database Schema (Working):**

```prisma
model Venue {
  verified        Boolean   @default(false)
  verifiedAt      DateTime?
  rejectedAt      DateTime?
  rejectedBy      String?
  rejectionReason String?   @db.Text
}
```

**Three States (Working in Production):**

1. **PENDING** - `verified = false AND rejectedAt = null`
2. **VERIFIED** - `verified = true`
3. **REJECTED** - `rejectedAt !== null`

**Current Verification Flows (Working):**

#### Flow 1: Blog Owner Solo Verification

- Blog owner opens curator page
- Clicks "Approve" on pending venue
- API sets `verified = true`, `verifiedAt = now()`
- Venue status changes to VERIFIED ✅

#### Flow 2: Curator Rejection

- Curator opens curator page
- Clicks "Reject" on pending venue
- Must enter rejection reason
- API sets `rejectedAt = now()`, `rejectedBy = wallet`, `rejectionReason = text`
- Venue status changes to REJECTED ✅

**Working Code Locations:**

- `/app/curator/page.tsx` - Approve/Reject UI
- `/app/api/venues/[id]/route.ts` (lines 128-154) - Verification logic
- `/components/VenueDetailsView.tsx` (lines 170-211) - Status display
- `/types/venue.ts` - Venue interface with rejection fields

---

## 🎯 What Sprint 2 WPB-3 Adds

### Democratic Validation (3-Validator Consensus)

**New Flow to Implement:**

#### Flow 3: Community Validation (NEW)

1. **Validator 1** votes to approve venue
   - Creates record in VenueValidation table
   - Vote count: 1/3
   - Venue remains PENDING
   - No PXP awarded yet

2. **Validator 2** votes to approve venue
   - Creates record in VenueValidation table
   - Vote count: 2/3
   - Venue remains PENDING
   - No PXP awarded yet

3. **Validator 3** votes to approve venue
   - Creates record in VenueValidation table
   - Vote count: 3/3 ✅ **THRESHOLD MET**
   - **Trigger verification:**
     - Set `venue.verified = true`
     - Set `venue.verifiedAt = now()`
   - **Distribute PXP rewards:**
     - Award 25 PXP to Validator 1
     - Award 25 PXP to Validator 2
     - Award 25 PXP to Validator 3
     - Award 50 PXP to original scout
   - Record all 4 transactions in database + Celo blockchain
   - Venue status changes to VERIFIED ✅

**Database Models (Already Exist from Sprint 1):**

```prisma
// Multi-signature venue validation system (3 validators required)
model VenueValidation {
  id          Int      @id @default(autoincrement())
  venue       Venue    @relation(fields: [venueId], references: [id])
  venueId     Int
  validator   User     @relation(fields: [validatorId], references: [id])
  validatorId Int

  // Validation decision
  approved    Boolean  // true = approve, false = reject
  notes       String?  @db.Text
  rating      Int?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([venueId, validatorId]) // Each validator votes once
}
```

---

## 🔨 Sprint 2 Implementation Tasks

### Task 1: Create Validation API Endpoint

**File to Create:** `/app/api/venues/[venueId]/validate/route.ts`

**Logic:**

```typescript
export async function POST(request: NextRequest) {
  // 1. Check if user has CURATOR or BLOG_OWNER role
  const authResult = await requireRole(request, [UserRole.CURATOR, UserRole.BLOG_OWNER])

  const { approved, notes, rating } = await request.json()

  // 2. If BLOG_OWNER -> Use existing solo verification flow (no change)
  if (authResult.user.role === UserRole.BLOG_OWNER) {
    // Use existing PUT /api/venues/[id] endpoint
    // This already handles verified = true
    return await soloVerification(venueId, approved)
  }

  // 3. If CURATOR -> Create VenueValidation record
  const validation = await prisma.venueValidation.create({
    data: {
      venueId: parseInt(venueId),
      validatorId: authResult.user.id,
      approved,
      notes,
      rating,
    },
  })

  // 4. Count approvals for this venue
  const approvalCount = await prisma.venueValidation.count({
    where: {
      venueId: parseInt(venueId),
      approved: true,
    },
  })

  // 5. If 3+ approvals -> Trigger verification + PXP distribution
  if (approvalCount >= 3) {
    // Update venue to verified (using existing logic)
    await prisma.venue.update({
      where: { id: parseInt(venueId) },
      data: {
        verified: true,
        verifiedAt: new Date(),
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      },
    })

    // Get all 3 validators who approved
    const validators = await prisma.venueValidation.findMany({
      where: {
        venueId: parseInt(venueId),
        approved: true,
      },
      include: { validator: true },
      take: 3,
    })

    // Get venue to find scout
    const venue = await prisma.venue.findUnique({
      where: { id: parseInt(venueId) },
    })

    // Award PXP to validators (25 PXP each)
    for (const validation of validators) {
      await awardValidatorReward(venueId, validation.validator.walletAddress, 25)
    }

    // Award PXP to scout (50 PXP)
    await awardScoutReward(venueId, venue.submittedBy, 50)
  }

  return NextResponse.json({
    success: true,
    approvalCount,
    threshold: 3,
    verified: approvalCount >= 3,
  })
}
```

### Task 2: Create Validator Dashboard UI

**File to Create:** `/app/validator/page.tsx`

**Features:**

- Show pending venues (not verified, not rejected)
- Show venues user already validated
- Voting UI: Approve / Reject buttons
- Notes textarea
- Rating selector (1-5 stars)
- Real-time approval count (e.g., "2/3 validators approved")

**Similar to curator page but:**

- ✅ Shows validation count progress
- ✅ Disables voting if user already voted
- ✅ Shows "Waiting for X more validators" message

### Task 3: PXP Reward Service

**File to Create:** `/lib/celo/rewardService.ts`

```typescript
export async function awardValidatorReward(
  venueId: number,
  validatorAddress: string,
  amount: number
): Promise<{ txHash: string }> {
  // 1. Create PXP transaction on Celo blockchain
  const txHash = await sendPXPTransaction(validatorAddress, amount)

  // 2. Record in PostgreSQL Transaction table
  await prisma.transaction.create({
    data: {
      walletAddress: validatorAddress,
      amount,
      type: 'VALIDATOR_REWARD',
      relatedId: venueId,
      txHash,
      status: 'COMPLETED',
    },
  })

  return { txHash }
}

export async function awardScoutReward(
  venueId: number,
  scoutAddress: string,
  amount: number
): Promise<{ txHash: string }> {
  // Same as above but type: 'SCOUT_REWARD'
}
```

### Task 4: Update Curator Page (Optional Enhancement)

**File to Modify:** `/app/curator/page.tsx`

**Add validation count display:**

```typescript
// Show how many validators have already approved
const validationCount = await prisma.venueValidation.count({
  where: { venueId: venue.id, approved: true },
})

// Display: "2/3 validators approved" or "Validated by blog owner"
```

---

## 🔄 Verification Flows Summary

### Flow 1: Blog Owner Solo (Existing - No Change)

```
Blog Owner → Approve → verified = true → VERIFIED ✅
                    ↓
                 Scout gets 50 PXP (NEW in Sprint 2)
```

### Flow 2: Curator Rejection (Existing - No Change)

```
Curator → Reject (with reason) → rejectedAt = now() → REJECTED ✅
```

### Flow 3: Democratic Validation (NEW in Sprint 2)

```
Validator 1 → Approve → VenueValidation (1/3) → PENDING
Validator 2 → Approve → VenueValidation (2/3) → PENDING
Validator 3 → Approve → VenueValidation (3/3) → THRESHOLD MET
                                               ↓
                                   verified = true → VERIFIED ✅
                                               ↓
                         ┌─────────────────────┴─────────────────────┐
                         ↓                                           ↓
              Validators get 25 PXP each                  Scout gets 50 PXP
              (3 transactions)                            (1 transaction)
```

---

## 📊 Database Changes Required

### New Transaction Model (for PXP tracking)

```prisma
model Transaction {
  id            Int      @id @default(autoincrement())
  walletAddress String
  amount        Decimal  @db.Decimal(10, 2)
  type          String   // "WELCOME_REWARD", "VALIDATOR_REWARD", "SCOUT_REWARD"
  relatedId     Int?     // Venue ID for validator/scout rewards
  txHash        String?  // Celo blockchain transaction hash
  status        String   @default("PENDING") // "PENDING", "COMPLETED", "FAILED"
  createdAt     DateTime @default(now())

  @@index([walletAddress])
  @@index([type])
  @@index([status])
}
```

**Migration:**

```bash
npx prisma migrate dev --name add_transactions_for_pxp_rewards
```

---

## ✅ Testing Checklist

### Existing Functionality (Should NOT Break)

- [ ] Blog owner can still verify venues solo
- [ ] Blog owner solo verification still works
- [ ] Curator can still reject venues
- [ ] Rejection reason still required
- [ ] Venue status badges still show correctly (green/red/yellow)
- [ ] Rejection reason still displays on venue detail page

### New Functionality (Sprint 2)

- [ ] Validator can vote to approve venue
- [ ] Validator can vote to reject venue
- [ ] Validator cannot vote twice on same venue
- [ ] Approval count displays correctly (1/3, 2/3, 3/3)
- [ ] 3rd approval triggers verification
- [ ] 3rd approval triggers PXP distribution:
  - [ ] Validator 1 receives 25 PXP
  - [ ] Validator 2 receives 25 PXP
  - [ ] Validator 3 receives 25 PXP
  - [ ] Scout receives 50 PXP
- [ ] All 4 transactions recorded in PostgreSQL
- [ ] All 4 transactions recorded on Celo blockchain
- [ ] Validator dashboard shows pending venues
- [ ] Validator dashboard shows validation history

---

## 🎯 Sprint 2 Scope Clarification

### What We're NOT Doing:

- ❌ Replacing the verification system
- ❌ Changing the 3-state logic (PENDING/VERIFIED/REJECTED)
- ❌ Modifying existing Blog Owner solo verification
- ❌ Changing existing rejection workflow
- ❌ Migrating to enum (keeping Boolean + DateTime approach)

### What We ARE Doing:

- ✅ Adding VenueValidation voting system
- ✅ Implementing 3-validator threshold logic
- ✅ Creating validator dashboard UI
- ✅ Integrating PXP reward distribution
- ✅ Creating Transaction tracking model
- ✅ Recording PXP awards on Celo blockchain

---

## 📅 Estimated Effort (Revised)

**Original estimate:** 16 hours (assumed building from scratch)
**Revised estimate:** 10 hours (extending existing system)

**Breakdown:**

- Validation API endpoint: 3 hours
- Validator dashboard UI: 3 hours
- PXP reward service: 2 hours
- Transaction model + migration: 1 hour
- Testing all flows: 1 hour

**Time saved:** 6 hours (existing verification system already works!)

---

**Last Updated:** 2025-10-29
**Status:** Clarified - Ready for Sprint 2 implementation
