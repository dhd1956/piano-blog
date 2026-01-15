# Phase 1: Scout & Curator PXP Rewards - Test Plan

**Date**: 2026-01-12
**Status**: Ready for Testing
**Implementation**: Phase 1 of PXP_TOKENOMICS_BEST_PRACTICES.md

---

## What Was Implemented

### Scout Rewards (50 PXP)

- **Trigger**: When a curator approves a venue submission
- **Recipient**: The user who originally submitted the venue (scout)
- **Amount**: 50 PXP (updated from 75 PXP)
- **Database Config**: `venue_verified`

### Curator Rewards (20 PXP)

- **Trigger**: When a curator approves a venue submission
- **Recipient**: The curator who clicked "Approve"
- **Amount**: 20 PXP (NEW - previously not implemented)
- **Database Config**: `curator_verification`

---

## Files Modified

1. **`prisma/seed-pxp-config.ts`**
   - Updated `venue_verified` from 75 → 50 PXP
   - Added new config: `curator_verification` (20 PXP)
   - Database seeded successfully ✅

2. **`app/api/venues/[id]/route.ts`**
   - Lines 240-270: Added curator reward logic
   - Awards 20 PXP to curator when venue is verified
   - Error handling to prevent failures

3. **`utils/rewards-contract.ts`**
   - Updated `REWARD_AMOUNTS.VERIFIER` from 25 → 20 PXP
   - Added comments explaining each reward type

---

## Test Scenarios

### Prerequisites

1. **Two Test Accounts**:
   - **Scout Account**: Username/password user (e.g., `scout1`)
   - **Curator Account**: User with CURATOR role (e.g., `curator1`)

2. **Check Initial PXP Balances**:

   ```sql
   SELECT username, "totalCAVEarned" as pxp
   FROM "User"
   WHERE username IN ('scout1', 'curator1');
   ```

3. **Verify PXP Config** (already done):
   ```sql
   SELECT key, value, label, enabled
   FROM "PXPConfig"
   WHERE key IN ('venue_verified', 'curator_verification');
   ```

---

### Test Case 1: Scout Reward (50 PXP)

**Objective**: Verify that scouts earn 50 PXP when their venue is approved

**Steps**:

1. **Log in as Scout**:
   - Go to `/auth/login`
   - Login with scout account (e.g., `scout1`)

2. **Submit a New Venue**:
   - Navigate to `/submit`
   - Fill out venue form:
     - Name: "Test Venue for PXP Scout Reward"
     - City: "Toronto"
     - Contact: test@example.com
     - Has Piano: Yes
   - Submit venue
   - Note: Venue will be `verified: false` (pending)

3. **Check Scout's PXP Balance Before**:
   - Go to `/profile/scout1` (or scout's profile)
   - Note the current PXP balance

4. **Log in as Curator**:
   - Log out
   - Go to `/auth/login`
   - Login with curator account

5. **Approve the Venue**:
   - Navigate to `/curator`
   - Find "Test Venue for PXP Scout Reward" in the list
   - Click "Review"
   - Click "✓ Approve"
   - Verify success message appears

6. **Check Scout's PXP Balance After**:
   - Navigate to scout's profile: `/profile/scout1`
   - **Expected**: PXP balance increased by **+50 PXP**

7. **Verify in Database**:

   ```sql
   SELECT username, "totalCAVEarned" as pxp, "firstPXPEarnedAt"
   FROM "User"
   WHERE username = 'scout1';
   ```

8. **Check Server Logs**:
   - Look for log message:
     ```
     ✅ Awarded 50 PXP to scout scout1 for verified venue Test Venue for PXP Scout Reward
     ```

**Expected Results**:

- ✅ Scout receives +50 PXP
- ✅ Scout's `totalCAVEarned` incremented by 50
- ✅ If first PXP: `firstPXPEarnedAt` is set
- ✅ Console log confirms reward

---

### Test Case 2: Curator Reward (20 PXP)

**Objective**: Verify that curators earn 20 PXP when they approve a venue

**Steps**:

1. **Check Curator's PXP Balance Before**:
   - While logged in as curator, go to your profile
   - Note the current PXP balance

2. **Submit Another Venue** (as scout or have one pending):
   - Need a pending venue to approve
   - Can submit as scout: "Test Venue for PXP Curator Reward"

3. **Approve the Venue** (as curator):
   - Go to `/curator`
   - Find the pending venue
   - Click "Review"
   - Click "✓ Approve"

4. **Check Curator's PXP Balance After**:
   - Navigate to curator's profile
   - **Expected**: PXP balance increased by **+20 PXP**

5. **Verify in Database**:

   ```sql
   SELECT username, "totalCAVEarned" as pxp
   FROM "User"
   WHERE username = 'curator1';
   ```

6. **Check Server Logs**:
   - Look for log message:
     ```
     ✅ Awarded 20 PXP to curator curator1 for verifying venue Test Venue for PXP Curator Reward
     ```

**Expected Results**:

- ✅ Curator receives +20 PXP
- ✅ Curator's `totalCAVEarned` incremented by 20
- ✅ Console log confirms reward

---

### Test Case 3: Both Rewards Together

**Objective**: Verify that BOTH scout and curator receive PXP for the same venue approval

**Steps**:

1. **Record Initial Balances**:
   - Scout: X PXP
   - Curator: Y PXP

2. **Scout submits venue** → **Curator approves**

3. **Check Final Balances**:
   - Scout: X + 50 PXP ✅
   - Curator: Y + 20 PXP ✅

**Expected Results**:

- ✅ Total 70 PXP distributed (50 to scout, 20 to curator)
- ✅ Both users see updated balances immediately
- ✅ Balances persist after page refresh

---

### Test Case 4: Rejection (No Rewards)

**Objective**: Verify that NO PXP is awarded when a venue is rejected

**Steps**:

1. **Scout submits venue**:
   - Name: "Test Venue for Rejection"

2. **Record Initial Balances**:
   - Scout: X PXP
   - Curator: Y PXP

3. **Curator rejects venue**:
   - Go to `/curator`
   - Click "Review"
   - Add rejection reason: "Duplicate venue"
   - Click "✗ Reject"

4. **Check Balances After Rejection**:
   - Scout: Still X PXP (no change) ✅
   - Curator: Still Y PXP (no change) ✅

**Expected Results**:

- ✅ No PXP awarded to scout (venue not verified)
- ✅ No PXP awarded to curator (didn't approve)
- ✅ Balances unchanged

---

### Test Case 5: Re-verification (No Double Rewards)

**Objective**: Verify that rewards are only given ONCE per venue

**Steps**:

1. **Approve a venue** (already approved earlier)

2. **Try to "re-verify"** (edit venue and set verified=true again):
   - Go to `/curator`
   - Find already-verified venue
   - Click "Review"
   - Edit something (e.g., description)
   - Save changes

3. **Check Balances**:
   - Scout: No additional PXP ✅
   - Curator: No additional PXP ✅

**Expected Results**:

- ✅ No duplicate rewards
- ✅ Rewards only given on FIRST verification (`isNewlyVerified` check)

---

### Test Case 6: Multiple Venues

**Objective**: Verify rewards work correctly for multiple venue approvals

**Steps**:

1. **Scout submits 3 venues**:
   - Venue A, Venue B, Venue C

2. **Curator approves all 3**:
   - Approve A → Scout +50, Curator +20
   - Approve B → Scout +50, Curator +20
   - Approve C → Scout +50, Curator +20

3. **Final Balances**:
   - Scout: Initial + 150 PXP ✅
   - Curator: Initial + 60 PXP ✅

**Expected Results**:

- ✅ Rewards correctly accumulate
- ✅ No errors with multiple transactions
- ✅ Database updates correctly

---

## Edge Cases

### Edge Case 1: Scout User Not Found

**Scenario**: Venue submitted by wallet address that doesn't exist in database

**Expected Behavior**:

- ⚠️ Warning logged: "Could not find user with wallet address..."
- ✅ Curator still receives 20 PXP
- ✅ Venue still gets verified
- ✅ No API error

**Test**: Check server logs for warning message

---

### Edge Case 2: PXP Config Disabled

**Scenario**: Admin disables rewards in PXP config

**Steps**:

```sql
UPDATE "PXPConfig"
SET enabled = false
WHERE key = 'curator_verification';
```

**Expected Behavior**:

- ⚠️ Curator receives 0 PXP (config disabled)
- ✅ Scout still receives 50 PXP (if enabled)
- ✅ No errors

**Test**: Verify rewards respect `enabled` flag

---

### Edge Case 3: Database Error

**Scenario**: Database unavailable during PXP award

**Expected Behavior**:

- ⚠️ Error logged: "Error awarding curator verification PXP..."
- ✅ Venue still gets verified (PXP error doesn't block update)
- ✅ User sees success message
- ❌ PXP not awarded (should retry manually)

**Test**: Simulate by temporarily disconnecting database

---

## Success Criteria

### Must Pass:

- ✅ Scout receives exactly 50 PXP on venue approval
- ✅ Curator receives exactly 20 PXP on venue approval
- ✅ Both rewards given simultaneously for same approval
- ✅ No rewards given on rejection
- ✅ No duplicate rewards on re-verification
- ✅ PXP balances persist correctly in database
- ✅ Server logs confirm rewards
- ✅ No API errors or crashes

### Should Pass:

- ✅ Rewards work for multiple venues
- ✅ Graceful handling when scout user not found
- ✅ PXP config `enabled` flag respected
- ✅ Database errors don't block venue verification

---

## Rollback Plan

If critical issues found:

1. **Disable Rewards**:

   ```sql
   UPDATE "PXPConfig"
   SET enabled = false
   WHERE key IN ('venue_verified', 'curator_verification');
   ```

2. **Revert Code Changes**:

   ```bash
   git revert HEAD
   git push
   ```

3. **Fix Incorrect Balances** (if needed):
   ```sql
   -- Example: Remove incorrect rewards
   UPDATE "User"
   SET "totalCAVEarned" = "totalCAVEarned" - 50
   WHERE username = 'scout1' AND "totalCAVEarned" > 50;
   ```

---

## Post-Testing Checklist

After successful testing:

- [ ] All test cases passed
- [ ] No errors in server logs
- [ ] PXP balances correct in database
- [ ] Leaderboard shows updated balances
- [ ] User profiles display correct PXP
- [ ] Document any issues found
- [ ] Create issues for Phase 2 features (tipping, etc.)

---

## Next Steps (Phase 2)

After Phase 1 is stable:

1. **Implement Tipping** (CRITICAL)
   - User-to-user PXP transfers
   - Venue tipping
   - 10% burn mechanism

2. **Add Notifications**
   - Toast notification when PXP earned
   - Email notification for large rewards

3. **Badge Auto-Award**
   - `top_scout` badge at 10 verified venues
   - `verified_curator` badge when promoted

4. **Admin Dashboard**
   - PXP metrics at `/admin/tokenomics`
   - Reward configuration UI

---

## Related Documents

- [PXP_TOKENOMICS_BEST_PRACTICES.md](./PXP_TOKENOMICS_BEST_PRACTICES.md) - Full tokenomics plan
- [PXP_REWARDS_MVP.md](./PXP_REWARDS_MVP.md) - Implementation status
- [PXP_EPIC.md](./PXP_EPIC.md) - User stories

---

**Tester**: **********\_**********
**Date Tested**: **********\_**********
**Result**: ⬜ Pass / ⬜ Fail / ⬜ Needs Revision
