# PXP Rewards MVP Implementation

**Date:** December 13, 2025
**Status:** Phase 1 MVP Complete

---

## What's Implemented ✅

### 1. Welcome Reward System

**User Flow:**

1. User connects wallet and visits their profile
2. Banner appears: "🎁 Welcome Reward Available! Claim your 25 PXP"
3. User clicks "Claim Reward" button
4. Wallet transaction triggers (blockchain)
5. Database updated with claimed status
6. Success message shows transaction hash

**Files Created:**

- `components/rewards/WelcomeRewardBanner.tsx` - Banner component
- `app/api/rewards/check-welcome/route.ts` - Check eligibility API
- `app/api/rewards/mark-claimed/route.ts` - Mark as claimed API

**Files Modified:**

- `utils/rewards-contract.ts` - Added `checkWelcomeRewardEligibility()` helper
- `app/profile/[address]/page.tsx` - Integrated banner (lines 190-192)

**How It Works:**

```
User Profile Page
    ↓
Check if eligible (API)
    ↓
Show banner if eligible
    ↓
User clicks "Claim"
    ↓
Call blockchain contract
    ↓
Update database
    ↓
Show success message
```

---

## What's NOT Implemented ❌

### 2. Scout Reward (Needs Implementation)

**Planned Flow:**

1. Curator approves venue
2. System calls `distributeScoutReward()`
3. Scout receives 50 PXP
4. Notification sent to scout

**Required Changes:**

- Modify `app/curator/page.tsx` - Add reward trigger in verification flow
- Create notification system (Prisma model + API)
- Add scout reward notification UI

### 3. Pending Rewards Notification

**Planned Components:**

- `components/rewards/PendingRewardsNotification.tsx`
- `hooks/usePendingRewards.ts`
- `app/api/rewards/pending/route.ts`

**Not implemented yet** - would show badge with number of claimable rewards

---

## Testing

### Manual Test Steps

1. **Connect wallet** (MetaMask on Celo Sepolia)
2. **Visit your profile**: `/profile/[your-address]`
3. **Look for banner**: Should show "Welcome Reward Available"
4. **Click "Claim Reward"**: MetaMask popup should appear
5. **Confirm transaction**: Wait for confirmation
6. **Check success message**: Should show transaction hash
7. **Refresh page**: Banner should disappear (already claimed)

### Development Mode

If `NEXT_PUBLIC_PXP_REWARDS_ADDRESS` is not set or is zero address:

- Rewards work in "development mode"
- No real blockchain transactions
- Logs to console instead
- Still updates database

---

## Configuration

### Environment Variables

```bash
# Required for production rewards
NEXT_PUBLIC_PXP_REWARDS_ADDRESS="0x..." # Your deployed rewards contract
NEXT_PUBLIC_PXP_TOKEN_ADDRESS="0x..." # PXP token contract

# Optional (has defaults)
CELO_TESTNET_RPC_URL="https://rpc.ankr.com/celo_sepolia"
```

### Smart Contract

The rewards contract must be deployed on Celo Sepolia with:

- `claimNewUserReward()` function
- `hasClaimedNewUserReward(address)` view function
- Sufficient PXP token balance for distributions

---

## Next Steps (To Complete Phase 1)

### High Priority

1. **Scout Reward Integration** (2-3 hours)
   - Add to curator verification flow
   - Create notification when scout receives reward
   - Test end-to-end

2. **Notification System** (2-3 hours)
   - Create Prisma Notification model
   - Add API endpoints for notifications
   - Create notification bell component

3. **Testing** (1 hour)
   - Test with real wallet on Celo Sepolia
   - Verify blockchain transactions
   - Check database updates

### Medium Priority

4. **Error Handling**
   - Better error messages
   - Handle network failures gracefully
   - Retry logic for failed transactions

5. **UI Polish**
   - Loading states
   - Transaction pending indicators
   - Success animations

---

## Known Issues

1. **Development Mode**: Contract calls fail if PXP_REWARDS_ADDRESS is zero address
   - Workaround: Functions return success with simulated data
   - Production: Must deploy contracts first

2. **No Transaction History**: Users can't see past reward claims
   - Future: Add rewards history page

3. **No Notification System**: Scouts don't know when they receive rewards
   - Future: Implement notification bell/inbox

---

## Architecture Notes

**Why client-side claiming?**

- Smart contract requires user's signature
- User pays gas fees (or uses gas sponsorship)
- More secure - user controls when they claim

**Why database tracking?**

- Faster eligibility checks (no blockchain call)
- Can show rewards even if user hasn't claimed yet
- Enables future features (reward history, notifications)

**Development Mode:**

- Allows testing without deployed contracts
- Simulates blockchain interactions
- Logs to console for debugging

---

## Related Documentation

- Full roadmap: `docs/sprints/SPRINT2_COMPLETION_ROADMAP.md`
- Sprint status: `docs/sprints/SPRINT2_STATUS.md`
- Contract ABI: `utils/rewards-contract.ts`

---

## Summary

**MVP Status: 40% Complete**

✅ Welcome reward detection and claiming
✅ Database integration
✅ Development mode for testing
❌ Scout rewards (curator integration)
❌ Notification system
❌ Rewards history/tracking

**Estimated to complete Phase 1:** 5-7 additional hours

This MVP demonstrates the core concept and can be tested immediately. The remaining work is primarily integration into existing flows (curator page) and polish (notifications, history).
