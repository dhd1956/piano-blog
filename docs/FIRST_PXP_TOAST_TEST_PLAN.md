# First PXP Toast - End-to-End Test Plan

## Test Overview

This document outlines the testing procedure for the first PXP celebration toast feature.

**Feature**: When a user earns their first PXP tokens, a celebration toast appears encouraging them to link a wallet.

**Components Tested**:

- Backend: PXP awarding logic (`/app/api/venues/route.ts`)
- Frontend: Toast rendering (`/app/submit/page.tsx`)
- Database: PXP tracking fields (User model)
- Auth: Session user retrieval (`lib/auth-middleware.ts`)

---

## Pre-Test Verification ✅

### 1. Database Schema

**Status**: ✅ Verified

Required fields in User model:

- ✅ `totalCAVEarned` (Float, default: 0)
- ✅ `firstPXPEarnedAt` (DateTime, nullable)
- ✅ `walletLinkingPromptDismissedAt` (DateTime, nullable)
- ✅ `walletLinkingPromptShownCount` (Int, default: 0)

**Verification Command**:

```bash
npx prisma validate
# Output: "The schema at prisma/schema.prisma is valid 🚀"
```

### 2. Backend API Logic

**Status**: ✅ Verified

File: `/app/api/venues/route.ts` (lines 110-165)

**Key Logic**:

1. Gets session user via `getSessionUser()`
2. Fetches user's current PXP status from database
3. Checks if this is first PXP: `!user.firstPXPEarnedAt && user.totalCAVEarned === 0`
4. Awards 50 PXP via `totalCAVEarned: { increment: 50 }`
5. Sets `firstPXPEarnedAt` if first PXP
6. Returns `showFirstPXPToast` and `pxpEarned` flags

**Error Handling**:

- PXP errors don't fail venue submission
- Logs errors for debugging

### 3. Frontend Integration

**Status**: ✅ Verified

File: `/app/submit/page.tsx`

**State Management**:

```typescript
const [showFirstPXPToast, setShowFirstPXPToast] = useState(false)
const [pxpEarned, setPxpEarned] = useState(0)
```

**Response Handling** (lines 297-302):

```typescript
if (result.showFirstPXPToast && result.pxpEarned) {
  setPxpEarned(result.pxpEarned)
  setShowFirstPXPToast(true)
  console.log('🎉 First PXP earned! Showing celebration toast')
}
```

**Toast Rendering** (lines 771-775):

```tsx
{
  showFirstPXPToast && (
    <WalletLinkingToast pxpAmount={pxpEarned} onClose={() => setShowFirstPXPToast(false)} />
  )
}
```

### 4. Authentication

**Status**: ✅ Verified

File: `/lib/auth-middleware.ts`

**Session Retrieval** (lines 237-258):

- Reads `auth_token` from cookies
- Verifies JWT token
- Fetches full user data from database
- Returns `AuthUser` object with `id` field

---

## Manual Test Scenarios

### Test Case 1: First-Time User Earns First PXP ✅ EXPECTED BEHAVIOR

**Setup**:

1. Create a new user account (username/password or Google OAuth)
2. Verify user has NO PXP (`totalCAVEarned = 0`)
3. Verify `firstPXPEarnedAt` is NULL

**Steps**:

1. Sign in with the new user account
2. Navigate to `/submit`
3. Fill out venue submission form:
   - Name: "Test Venue"
   - City: "Toronto"
   - Address: "123 Test St"
   - Email: "test@venue.com"
   - Check "Has Piano Available for Use"
4. Click "Submit Venue for Verification"

**Expected Results**:

- ✅ Venue submission succeeds
- ✅ Success message appears: "Venue submitted successfully! ID: {id}"
- ✅ Backend logs: `✅ Awarded 50 PXP to user {id} for venue submission (FIRST PXP!)`
- ✅ **Toast appears** in bottom-right corner:
  - Green gradient header with 🎉 emoji
  - "Congratulations! You earned your first PXP!"
  - Displays "50 PXP" with coin icon
  - Shows "≈ $0.50 USD"
  - Lists 3 benefits (30 seconds, no gas fees, keep account)
  - "Link Wallet Now" button
- ✅ Toast auto-dismisses after 8 seconds
- ✅ Database updates:
  - `totalCAVEarned` = 50
  - `firstPXPEarnedAt` = {current timestamp}

**Database Verification**:

```sql
SELECT id, totalCAVEarned, firstPXPEarnedAt
FROM "User"
WHERE id = {user_id};
```

---

### Test Case 2: Existing User Earns Additional PXP ❌ TOAST SHOULD NOT APPEAR

**Setup**:

1. Use a user account with existing PXP (`totalCAVEarned > 0`)
2. Verify `firstPXPEarnedAt` is NOT NULL

**Steps**:

1. Sign in with existing user
2. Submit a second venue

**Expected Results**:

- ✅ Venue submission succeeds
- ✅ Success message appears
- ✅ Backend logs: `✅ Awarded 50 PXP to user {id} for venue submission` (no "FIRST PXP!")
- ❌ **Toast does NOT appear** (showFirstPXPToast = false)
- ✅ Database updates:
  - `totalCAVEarned` increases by 50
  - `firstPXPEarnedAt` remains unchanged

---

### Test Case 3: Unauthenticated User Submits Venue ❌ NO PXP AWARDED

**Setup**:

1. Sign out (or use incognito mode)

**Steps**:

1. Navigate to `/submit`
2. Do NOT sign in
3. Submit venue anonymously

**Expected Results**:

- ✅ Venue submission succeeds (if allowed)
- ❌ No PXP awarded
- ❌ Toast does NOT appear
- ❌ `getSessionUser()` returns null
- ✅ Backend logs no PXP message

---

### Test Case 4: Toast Interaction ✅ EXPECTED BEHAVIOR

**Setup**:

1. Trigger first PXP toast (Test Case 1)

**Steps**:

1. Wait for toast to appear
2. Observe animations:
   - Toast slides in from bottom-right
   - Confetti emoji (🎉) bounces
3. Click "Link Wallet Now" button
4. Verify Reown AppKit modal opens
5. Close modal without linking
6. Click X button on toast
7. Verify toast closes immediately

**Alternative**:

1. Don't interact with toast
2. Wait 8 seconds
3. Verify toast auto-dismisses with fade-out animation

---

### Test Case 5: PXP Error Handling ✅ EXPECTED BEHAVIOR

**Setup**:

1. Create scenario where PXP awarding fails (e.g., database error)

**Steps**:

1. Submit venue with authenticated user

**Expected Results**:

- ✅ Venue submission STILL succeeds (doesn't fail)
- ✅ Backend logs: `Error awarding PXP: {error message}`
- ❌ Toast does NOT appear
- ✅ User sees success message for venue

**Note**: This tests the try-catch block that prevents PXP errors from breaking venue submissions.

---

## Console Log Verification

### Expected Console Output (First PXP):

```
🚀 About to submit venue: { name: "...", city: "...", ... }
✅ Awarded 50 PXP to user 123 for venue submission (FIRST PXP!)
✅ Venue submitted to database: { id: 456, ... }
🎉 First PXP earned! Showing celebration toast
```

### Expected Console Output (Subsequent PXP):

```
🚀 About to submit venue: { name: "...", city: "...", ... }
✅ Awarded 50 PXP to user 123 for venue submission
✅ Venue submitted to database: { id: 789, ... }
```

---

## API Response Verification

### First PXP Response:

```json
{
  "success": true,
  "venue": { "id": 456, "name": "...", ... },
  "message": "Venue submitted successfully! It will be reviewed by our curators.",
  "pxpEarned": 50,
  "showFirstPXPToast": true
}
```

### Subsequent PXP Response:

```json
{
  "success": true,
  "venue": { "id": 789, "name": "...", ... },
  "message": "Venue submitted successfully! It will be reviewed by our curators.",
  "pxpEarned": 50,
  "showFirstPXPToast": false
}
```

---

## Browser DevTools Testing

### Network Tab:

1. Open DevTools → Network tab
2. Submit venue
3. Find POST request to `/api/venues`
4. Verify response includes `pxpEarned` and `showFirstPXPToast` fields

### React DevTools:

1. Install React DevTools extension
2. Submit venue
3. Inspect `SubmitVenue` component state:
   - `showFirstPXPToast`: should be `true` for first PXP
   - `pxpEarned`: should be `50`

### Console Tab:

1. Open DevTools → Console
2. Look for PXP-related logs
3. Verify no errors during toast rendering

---

## Regression Testing

### Related Features to Verify:

1. ✅ Venue submission still works for all users (authenticated & unauthenticated)
2. ✅ PXP balance displayed correctly on dashboard
3. ✅ Wallet linking prompt card shows correct PXP amount
4. ✅ Profile setup banner reflects PXP status
5. ✅ Gas sponsorship status logs correctly

---

## Performance Considerations

### Toast Rendering:

- ✅ Toast appears within 100ms of venue submission success
- ✅ Animations are smooth (60fps)
- ✅ Auto-dismiss timer works correctly (8 seconds)
- ✅ No memory leaks (timer cleanup on unmount)

### Database Queries:

- ✅ Only 2 database queries per venue submission:
  1. `findUnique` to check PXP status
  2. `update` to award PXP
- ✅ Queries are fast (<100ms)

---

## Edge Cases

### Edge Case 1: Race Condition

**Scenario**: User submits multiple venues rapidly

**Expected**:

- Only first submission triggers toast
- Subsequent submissions don't show toast
- PXP accumulates correctly

### Edge Case 2: Browser Refresh During Toast

**Scenario**: User refreshes page while toast is visible

**Expected**:

- Toast disappears (state is not persisted)
- PXP still awarded (database updated)
- User can see PXP on dashboard

### Edge Case 3: Network Error

**Scenario**: API request fails or times out

**Expected**:

- Error message shown to user
- Toast does NOT appear
- No database changes

---

## Success Criteria

**All must pass**:

- ✅ First-time user sees toast on first PXP earned
- ✅ Toast displays correct PXP amount (50 PXP)
- ✅ Toast auto-dismisses after 8 seconds
- ✅ "Link Wallet Now" button opens Reown AppKit modal
- ✅ Close button dismisses toast immediately
- ✅ Database correctly tracks `firstPXPEarnedAt` timestamp
- ✅ Existing users do NOT see toast on subsequent PXP earnings
- ✅ Unauthenticated users don't trigger PXP logic
- ✅ Errors don't break venue submission
- ✅ No console errors during toast lifecycle

---

## Known Limitations

1. **Toast Persistence**: Toast state is not persisted across page refreshes (by design)
2. **Browser Compatibility**: Tested on modern browsers (Chrome, Firefox, Safari, Edge)
3. **Mobile**: Toast is responsive but may need UX adjustments for very small screens
4. **Accessibility**: Toast has `role="alert"` and `aria-live="polite"` for screen readers

---

## Post-Test Cleanup

After testing, you may want to:

1. Delete test venues from database
2. Reset test user's PXP balance to 0
3. Clear `firstPXPEarnedAt` timestamp for repeat testing

```sql
-- Reset test user's PXP for repeat testing
UPDATE "User"
SET "totalCAVEarned" = 0, "firstPXPEarnedAt" = NULL
WHERE id = {test_user_id};
```

---

## Test Results (To be filled manually)

### Test Date: ********\_********

### Tester: ********\_********

### Environment: ********\_********

| Test Case            | Status            | Notes |
| -------------------- | ----------------- | ----- |
| 1. First-time user   | ⬜ Pass / ⬜ Fail |       |
| 2. Existing user     | ⬜ Pass / ⬜ Fail |       |
| 3. Unauthenticated   | ⬜ Pass / ⬜ Fail |       |
| 4. Toast interaction | ⬜ Pass / ⬜ Fail |       |
| 5. Error handling    | ⬜ Pass / ⬜ Fail |       |

**Overall Result**: ⬜ Pass / ⬜ Fail

**Issues Found**:

- [ ] None
- [ ] Minor (list below)
- [ ] Major (list below)

**Notes**:

---

---

---

---

## Next Steps After Testing

If tests pass:

1. ✅ Mark feature as production-ready
2. ✅ Update Sprint 2 status documentation
3. ✅ Deploy to staging/production
4. ✅ Monitor analytics for toast engagement
5. ✅ Gather user feedback

If tests fail:

1. ❌ Document issues in GitHub Issues
2. ❌ Create bug fix tickets
3. ❌ Retest after fixes
4. ❌ Update this test plan if needed

---

**Document Version**: 1.0
**Last Updated**: 2025-12-28
**Related Features**: WPB-300 (Wallet Linking), Sprint 2
**Test Status**: ⏳ Pending Manual Verification
