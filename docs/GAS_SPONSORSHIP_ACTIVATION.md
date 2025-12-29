# Gas Sponsorship - Quick Activation Guide

## Current Status: READY BUT NOT ACTIVE ✅

The gas sponsorship code is fully implemented and ready to activate when you move to production. No action needed on testnet.

---

## When Should I Activate?

### Keep DISABLED (Current):

- ✅ During development and testing on Celo Sepolia testnet
- ✅ While user base is small (< 10 daily active users)
- ✅ When users can easily get testnet CELO from faucets

### Activate BEFORE Production:

- 🚀 When launching to mainnet (real CELO)
- 🚀 When expecting 50+ daily active users
- 🚀 When you want to provide seamless Web2-like UX

---

## How to Activate (When Ready)

**Total Time: 20 minutes**
**Cost: $100 initial + ~$25-30/month**

### Step 1: Sign Up for Pimlico (10 minutes)

```bash
1. Visit https://pimlico.io
2. Click "Sign Up" → Use email or GitHub
3. Create new project:
   - Name: "Global Piano Network Production"
   - Network: Celo Mainnet (or Celo Sepolia for testing)
4. Copy your API key (starts with "pim_...")
5. Add payment method
6. Fund account with $100
7. Set spending limit: $50/month initially
```

### Step 2: Set Environment Variables (5 minutes)

**For Local Development:**

Edit `.env.local`:

```bash
NEXT_PUBLIC_PAYMASTER_URL="https://api.pimlico.io/v2/celo-mainnet/rpc"
NEXT_PUBLIC_PIMLICO_API_KEY="pim_your_actual_api_key"
```

**For Production (Vercel):**

```bash
# In Vercel Dashboard → Settings → Environment Variables
1. Add: NEXT_PUBLIC_PAYMASTER_URL
   Value: https://api.pimlico.io/v2/celo-mainnet/rpc

2. Add: NEXT_PUBLIC_PIMLICO_API_KEY
   Value: pim_your_actual_api_key

3. Redeploy application
```

### Step 3: Verify (5 minutes)

```bash
# Start dev server
yarn dev

# Check browser console - should see:
# ✅ "Gas sponsorship enabled via Pimlico"

# Test transaction:
1. Sign in with email/Google
2. Submit a venue
3. Transaction completes without needing CELO
4. Check Pimlico dashboard for sponsored transaction
```

---

## How to Check if Active

### Method 1: Check Environment Variables

```bash
# In your terminal
echo $NEXT_PUBLIC_PAYMASTER_URL

# If empty or undefined → Gas sponsorship is OFF
# If shows Pimlico URL → Gas sponsorship is ON
```

### Method 2: Check Browser Console

```javascript
// Open browser console (F12)
// Look for one of these messages:

// ✅ Gas sponsorship ENABLED:
'Gas sponsorship enabled via Pimlico'

// ⚠️ Gas sponsorship DISABLED:
'Gas sponsorship not configured - users will pay gas fees'
```

### Method 3: Check Reown Connection

```javascript
// When connecting wallet, check console for:
'Account abstraction: enabled' // ✅ Sponsorship ON
'Account abstraction: disabled' // ❌ Sponsorship OFF
```

---

## Cost Monitoring

Once activated, monitor costs at:

- **Pimlico Dashboard**: https://dashboard.pimlico.io
- **Expected Costs**:
  - 10 DAU: $2-3/month
  - 50 DAU: $12-15/month
  - 100 DAU: $25-30/month
  - 500 DAU: $125-150/month

Set up alerts in Pimlico:

- Low balance alert (< $20)
- Daily spend alert (> $5)
- Monthly budget alert (> $50)

---

## Deactivating (If Needed)

To temporarily disable gas sponsorship:

### Option 1: Remove Environment Variables (Recommended)

```bash
# In Vercel → Environment Variables
# Delete: NEXT_PUBLIC_PAYMASTER_URL
# Delete: NEXT_PUBLIC_PIMLICO_API_KEY

# Redeploy
```

### Option 2: Comment Out in Code

```typescript
// In config/reown.tsx
// Comment out the account abstraction section:

// ...(paymasterUrl && {
//   accountAbstraction: {
//     sponsorGas: true,
//     paymasterUrl,
//     paymasterContext: { ... }
//   },
// }),
```

---

## Emergency Procedures

### If Costs Spike Unexpectedly

1. **Immediate**: Set spending cap in Pimlico to $0
2. **Investigate**: Check transaction logs for abuse
3. **Fix**: Reduce rate limits in `lib/gas-sponsorship.ts`
4. **Monitor**: Watch for 24 hours before re-enabling

### If Paymaster Goes Down

The system automatically falls back to user-paid gas:

- Users will see: "Platform sponsorship unavailable"
- Transactions still work, users pay own gas
- No service disruption

### If Budget Exceeded

Pimlico will:

1. Send email alert at 75% of budget
2. Stop sponsoring at 100% of budget
3. Users fall back to paying own gas
4. No transactions are blocked

---

## Testing Before Production

Want to test gas sponsorship before paying $100?

### Option 1: Pimlico Free Tier (Testnet Only)

Some paymasters offer free testnet sponsorship:

1. Sign up for Pimlico
2. Use testnet API endpoint
3. Get small free credit for testing
4. Test the full flow without cost

### Option 2: Manual Testing Checklist

Verify these work WITHOUT gas sponsorship active:

- ✅ Venue submission (user pays gas)
- ✅ Event RSVP (user pays gas)
- ✅ Profile updates (user pays gas)

Then when activated, verify:

- ✅ Same actions work WITHOUT user paying gas
- ✅ Pimlico dashboard shows transactions
- ✅ User doesn't see gas approval prompts

---

## Production Checklist

Before activating in production:

- [ ] Pimlico account created
- [ ] API key obtained and tested
- [ ] Payment method added
- [ ] Account funded with $100+
- [ ] Spending cap set ($50/month)
- [ ] Environment variables set in Vercel
- [ ] Application redeployed
- [ ] Test transaction verified
- [ ] Pimlico dashboard accessible
- [ ] Budget alerts configured
- [ ] Team trained on monitoring
- [ ] Rollback plan documented

---

## Support

**Questions?**

- Read full guide: `docs/GAS_SPONSORSHIP_SETUP.md`
- Pimlico docs: https://docs.pimlico.io
- Pimlico support: support@pimlico.io
- Project issues: https://github.com/dhd1956/piano-blog/issues

---

**Last Updated:** 2025-12-28
**Status:** Ready to Activate (Waiting for Production)
**Estimated Activation Time:** 20 minutes when ready
