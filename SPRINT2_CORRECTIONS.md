# Sprint 2 Planning Corrections - RBAC & Verification System

**Date:** 2025-10-29
**Correction:** Existing RBAC and verification infrastructure already built in Sprint 1

---

## ✅ What's Already Built (Sprint 1)

### RBAC System (Fully Implemented)

**User Roles** (from `/prisma/schema.prisma`):

```prisma
enum UserRole {
  BLOG_OWNER  // Full CRUD, instant verification power
  CURATOR     // Edit venues, NO verification power
  SCOUT       // Default role - can submit venues
}
```

**Authorization Middleware** (from `/lib/auth-middleware.ts`):

- `requireRole()` - Enforces role-based access
- `can()` - Permission checks
- Currently used in venue API routes

**Current Verification Powers:**

- **BLOG_OWNER:** Can verify venues instantly (solo approval)
- **CURATOR:** Can edit venues but CANNOT verify
- **SCOUT:** Can submit venues

---

### Database Models (Already Exist)

#### 1. VenueVerification Model

**Purpose:** Track individual verifications with blockchain references

```prisma
model VenueVerification {
  id              Int      @id @default(autoincrement())
  venue           Venue    @relation(fields: [venueId], references: [id])
  venueId         Int

  // Verification details
  verifierAddress String   // Curator wallet address
  approved        Boolean
  notes           String?  @db.Text
  rating          Int?     // 1-5 star rating from curator
  timestamp       DateTime @default(now())

  // Blockchain reference (for transparency)
  transactionHash String?  @unique
  blockNumber     Int?

  @@index([venueId, approved])
  @@index([verifierAddress])
}
```

#### 2. VenueValidation Model (Multi-Signature System)

**Purpose:** Democratic venue validation requiring 3 validators

```prisma
model VenueValidation {
  id          Int      @id @default(autoincrement())
  venue       Venue    @relation(fields: [venueId], references: [id])
  venueId     Int
  validator   User     @relation(fields: [validatorId], references: [id])
  validatorId Int

  // Validation decision
  approved    Boolean  // true = approve, false = reject
  notes       String?  @db.Text
  rating      Int?     // 1-5 star rating from validator

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([venueId, validatorId]) // Each validator can only vote once
  @@index([venueId, approved])
  @@index([validatorId])
}
```

---

## 🔄 Corrected Sprint 2 Scope for WPB-3

### What WPB-3 Actually Needs

**NOT** creating database schema (already exists)
**YES** implementing API logic and UI for existing models

### WPB-3: Democratic Venue Verification (Corrected)

**User Story:** As community members, we would like to review this Venue for possible piano oriented jam sessions.

**PXP Reward Structure:**

- **25 PXP** per validator (when 3rd validator approves)
- **50 PXP** to original scout (retroactive reward)
- **Threshold:** 3 validators required for democratic verification

---

### Implementation Tasks (Corrected)

#### Task 1: Implement Validation API Endpoints

**Files to Create:**

- `/app/api/venues/[venueId]/validate/route.ts` - Submit validation vote
- `/app/api/venues/[venueId]/validations/route.ts` - Get all validations

**API Logic:**

```typescript
// POST /api/venues/{venueId}/validate
// Request: { approved: boolean, notes?: string, rating?: number }

1. Check if user has CURATOR or BLOG_OWNER role
2. If BLOG_OWNER:
   - Set venue.verified = true immediately
   - Award 50 PXP to scout
   - Skip multi-validator logic
3. If CURATOR (validator):
   - Check if validator already voted (VenueValidation unique constraint)
   - Create VenueValidation record
   - Count approvals: SELECT COUNT(*) WHERE venueId = ? AND approved = true
   - If count >= 3:
     - Set venue.verified = true
     - Award 25 PXP to each of the 3 validators
     - Award 50 PXP to original scout
     - Record all transactions in PostgreSQL with Celo txHash
```

---

#### Task 2: Create Validator Dashboard UI

**Files to Create:**

- `/app/validator/page.tsx` - Validator dashboard (similar to curator page)
- `/components/validation/ValidationCard.tsx` - Venue card with voting UI
- `/components/validation/ValidationHistory.tsx` - Show past validations

**Dashboard Features:**

- Show pending venues (not verified, not rejected)
- Show venues user already validated (history)
- Voting buttons: Approve / Reject
- Notes textarea for validation comments
- Rating selector (1-5 stars)
- Real-time validation count (e.g., "2/3 validators approved")

---

#### Task 3: PXP Reward Distribution

**Files to Create/Modify:**

- `/lib/celo/rewardService.ts` - Centralized PXP distribution logic

**Reward Functions:**

```typescript
export async function awardValidatorReward(
  venueId: number,
  validatorAddress: string
): Promise<{ txHash: string }> {
  // Award 25 PXP to validator
  // Record in Transaction table
  // Return Celo transaction hash
}

export async function awardScoutReward(
  venueId: number,
  scoutAddress: string
): Promise<{ txHash: string }> {
  // Award 50 PXP to scout
  // Record in Transaction table
  // Return Celo transaction hash
}

export async function distributeVerificationRewards(venueId: number) {
  // Called when 3rd validator approves
  // Get all 3 validators from VenueValidation table
  // Award 25 PXP to each validator
  // Award 50 PXP to scout
  // Record all 4 transactions
}
```

---

#### Task 4: Update Curator Page (Optional)

**File:** `/app/curator/page.tsx`

**Changes:**

- Show validation count for each venue
- Display who has already validated
- Show if venue needs more validators (e.g., "Needs 2 more validators")

---

### Database Schema Updates Required

**NONE!** All models already exist:

- ✅ VenueVerification (blockchain references)
- ✅ VenueValidation (multi-signature voting)
- ✅ UserRole enum (BLOG_OWNER, CURATOR, SCOUT)
- ✅ Venue.verified field
- ✅ Venue.verifiedAt timestamp

**Only need to add:**

- Transaction model for PXP reward tracking (already planned in Sprint 2)

---

### Verification Flow (Complete Picture)

#### Option 1: Blog Owner Instant Verification

1. Blog owner clicks "Approve" on venue
2. Venue.verified = true immediately
3. Award 50 PXP to scout
4. Done (no multi-validator process)

#### Option 2: Democratic Validation (3 Validators)

1. Validator 1 approves venue
   - VenueValidation record created
   - Count = 1/3
   - No PXP awarded yet

2. Validator 2 approves venue
   - VenueValidation record created
   - Count = 2/3
   - No PXP awarded yet

3. Validator 3 approves venue
   - VenueValidation record created
   - Count = 3/3 ✅ THRESHOLD MET
   - Set venue.verified = true
   - Award 25 PXP to Validator 1 (txHash recorded)
   - Award 25 PXP to Validator 2 (txHash recorded)
   - Award 25 PXP to Validator 3 (txHash recorded)
   - Award 50 PXP to Scout (txHash recorded)
   - Send notifications to all parties

---

### Testing Checklist (Corrected)

- [ ] Blog owner can verify venue solo (existing feature)
- [ ] Curator can submit validation vote
- [ ] Curator cannot vote twice on same venue (unique constraint)
- [ ] Validation count shows correctly (e.g., "2/3 validators approved")
- [ ] 3rd approval triggers venue verification
- [ ] 3rd approval triggers PXP distribution:
  - [ ] Validator 1 receives 25 PXP
  - [ ] Validator 2 receives 25 PXP
  - [ ] Validator 3 receives 25 PXP
  - [ ] Scout receives 50 PXP
- [ ] All 4 transactions recorded in PostgreSQL
- [ ] All 4 transactions recorded on Celo blockchain
- [ ] Rejected validations tracked separately
- [ ] Validator dashboard shows pending venues
- [ ] Validator dashboard shows validation history

---

### Updated Effort Estimate

**Original Estimate:** 16 hours
**Corrected Estimate:** 12 hours (no schema creation needed)

**Breakdown:**

- API endpoints (validate + get validations): 4 hours
- Validator dashboard UI: 4 hours
- PXP reward distribution logic: 3 hours
- Testing and bug fixes: 1 hour

---

## Summary

**CRITICAL CORRECTION:** The database schema for democratic venue verification already exists in Sprint 1. It was designed with:

- **VenueVerification** model for blockchain-referenced verifications
- **VenueValidation** model for multi-signature validation (3 validators)
- **UserRole** enum distinguishing BLOG_OWNER (instant verify) from CURATOR (validator)

**Sprint 2 WPB-3 work is:**

- ✅ Implementing API logic to use existing models
- ✅ Creating validator dashboard UI
- ✅ Integrating PXP reward distribution
- ❌ NOT creating new database schema (already exists!)

This significantly reduces implementation complexity and ensures we're building on the solid RBAC foundation from Sprint 1.

---

**Last Updated:** 2025-10-29
**Reviewed By:** Project Owner
