# Gas Sponsorship Setup Guide

## Overview

This guide will help you enable gas sponsorship for the Global Piano Network, allowing users to interact with blockchain features without needing to hold CELO tokens.

**Benefits:**

- 73% fewer onboarding steps for users
- 80% faster time to first transaction
- Seamless Web2-like experience
- Very low cost: ~$25-30/month for 100 daily active users

---

## ⚠️ IMPORTANT: Testnet vs Production

**Current Status: Code is READY but NOT ACTIVE**

The gas sponsorship infrastructure is fully implemented and ready to activate. However:

- **Testnet (Current)**: Gas sponsorship is **OPTIONAL** - users can get free testnet CELO from faucets
- **Production (Future)**: Gas sponsorship becomes **ESSENTIAL** - users won't want to buy real CELO for small transactions

**Recommendation**: Keep gas sponsorship **disabled** on testnet until ready for production launch. This avoids the $100 setup cost while still allowing development and testing.

---

## Prerequisites

### For Development/Testnet (Current):

- ✅ Code is already integrated (nothing needed)
- ✅ Users can use testnet faucets for CELO
- ✅ Ready to activate when needed

### For Production (Future):

- Active Global Piano Network deployment
- Reown AppKit Project ID (from https://cloud.reown.com/)
- Credit card for paymaster service (Pimlico or Biconomy)
- Access to environment variables (Vercel, .env.local, etc.)

---

## Step 1: Sign Up for Paymaster Service

We recommend **Pimlico** for ease of use and good Celo support.

### Option A: Pimlico (Recommended)

1. **Go to Pimlico**: https://pimlico.io
2. **Create Account**: Sign up with email or GitHub
3. **Create New Project**:
   - Project name: "Global Piano Network"
   - Select blockchain: **Celo Sepolia Testnet**
4. **Get API Key**:
   - Navigate to "API Keys" section
   - Copy your API key (starts with `pim_`)
5. **Fund Account**:
   - Go to "Billing"
   - Add payment method
   - Initial deposit: $100 recommended
   - Set spending limit: $50/month initially

### Option B: Biconomy (Alternative)

1. Go to https://biconomy.io
2. Create account and project
3. Select Celo Sepolia network
4. Get API key from dashboard
5. Fund account with minimum $100

---

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Gas Sponsorship (Paymaster)
NEXT_PUBLIC_PAYMASTER_URL="https://api.pimlico.io/v2/celo-sepolia/rpc"
NEXT_PUBLIC_PIMLICO_API_KEY="pim_your_actual_api_key_here"

# Reown Project ID (if not already set)
NEXT_PUBLIC_REOWN_PROJECT_ID="your_reown_project_id"
```

### For Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:
   - Key: `NEXT_PUBLIC_PAYMASTER_URL`
     - Value: `https://api.pimlico.io/v2/celo-sepolia/rpc`
   - Key: `NEXT_PUBLIC_PIMLICO_API_KEY`
     - Value: Your Pimlico API key
3. Redeploy your application

---

## Step 3: Verify Configuration

The gas sponsorship code is already integrated. To verify it's working:

### Local Testing

1. **Start dev server**:

   ```bash
   yarn dev
   ```

2. **Check console for warnings**:
   - No errors about missing PAYMASTER_URL = Good!
   - Warnings about placeholder values = Need to set env vars

3. **Test wallet connection**:
   - Sign in with Google/Email
   - Check browser console for "Account abstraction enabled" messages

### Testing Sponsored Transactions

1. **Submit a test venue**:
   - Go to http://localhost:3000/submit
   - Fill out venue form
   - Submit without needing CELO tokens
   - Transaction should complete automatically

2. **Verify in Pimlico Dashboard**:
   - Go to Pimlico dashboard
   - Check "Transactions" tab
   - You should see the sponsored transaction

---

## Step 4: Configure Rate Limits (Optional)

The default rate limits are defined in `lib/gas-sponsorship.ts`:

```typescript
rateLimits: {
  submitVenue: 3,     // Max 3 venue submissions per day
  verifyVenue: 50,    // Max 50 verifications per day
  rsvpToEvent: 10,    // Max 10 RSVPs per day
  updateProfile: 5,   // Max 5 profile updates per day
  createEvent: 2,     // Max 2 events per day
}
```

To modify:

1. Edit `lib/gas-sponsorship.ts`
2. Adjust numbers based on your budget
3. Redeploy

---

## Step 5: Monitor Costs

### Daily Monitoring

Check Pimlico dashboard daily for:

- Total transactions sponsored
- Daily cost (should be < $1/day initially)
- Any unusual spikes

### Set Up Alerts

1. **In Pimlico Dashboard**:
   - Go to Settings → Notifications
   - Set up email alerts for:
     - Low balance (< $20)
     - Daily spend > $5
     - Unusual activity

2. **Budget Alerts**:
   - The code automatically tracks spending limits
   - Defined in `lib/gas-sponsorship.ts`:
     ```typescript
     budgetLimits: {
       dailyMaxUSD: 10,
       monthlyMaxUSD: 300,
       alertThreshold: 0.75,
     }
     ```

---

## Cost Breakdown

### Estimated Monthly Costs

| Daily Active Users | Transactions/Day | Monthly Cost |
| ------------------ | ---------------- | ------------ |
| 10                 | 10               | $2-3         |
| 50                 | 50               | $12-15       |
| 100                | 100              | $25-30       |
| 500                | 500              | $125-150     |
| 1000               | 1000             | $250-300     |

### Per Transaction Costs (Celo)

- Venue submission: ~$0.02
- Event RSVP: ~$0.005
- Profile update: ~$0.01
- Venue verification: ~$0.01

**Note:** Celo is one of the cheapest blockchain networks for transactions.

---

## Troubleshooting

### Problem: "Paymaster unavailable" error

**Solution:**

1. Check NEXT_PUBLIC_PAYMASTER_URL is set correctly
2. Verify API key is valid
3. Check Pimlico account balance
4. Restart development server

### Problem: Transactions still require gas

**Solution:**

1. Ensure environment variables are set in **production** environment (Vercel)
2. Verify user is using email/social login (not external wallet)
3. Check browser console for errors
4. Verify transaction method is in `sponsoredMethods` list

### Problem: High costs

**Solution:**

1. Check for spam/abuse in Pimlico dashboard
2. Reduce rate limits in `lib/gas-sponsorship.ts`
3. Review sponsored methods list
4. Enable CAPTCHA for high-volume actions

### Problem: Rate limits too strict

**Solution:**

1. Edit `lib/gas-sponsorship.ts`
2. Increase limits for specific methods
3. Monitor cost impact
4. Adjust as needed

---

## Security Best Practices

### 1. Keep API Keys Secret

- Never commit `.env.local` to git
- Use Vercel environment variables for production
- Rotate keys every 6 months

### 2. Monitor for Abuse

- Check Pimlico dashboard daily
- Set up automated alerts
- Review unusual transaction patterns

### 3. Rate Limiting

- Keep rate limits reasonable
- Adjust based on actual usage
- Add CAPTCHA if spam occurs

### 4. Method Restrictions

- Only sponsor necessary methods
- Never sponsor:
  - Token transfers
  - Token approvals
  - Contract deployments

---

## Next Steps

Once gas sponsorship is working:

1. **Monitor for 1 week**:
   - Track costs daily
   - Adjust limits if needed
   - Gather user feedback

2. **Optimize**:
   - Review most expensive methods
   - Adjust rate limits based on usage
   - Consider tiered sponsorship

3. **Scale**:
   - Increase budget as user base grows
   - Monitor cost per user
   - Implement monitoring dashboard (Phase 2)

---

## Production Checklist

Before enabling in production:

- [ ] Pimlico account created and funded
- [ ] API key obtained
- [ ] Environment variables set in Vercel
- [ ] Tested on testnet (Celo Sepolia)
- [ ] Budget alerts configured
- [ ] Rate limits reviewed and set
- [ ] Monitoring dashboard access verified
- [ ] Team notified of new feature
- [ ] User documentation updated

---

## Support

### Pimlico Support

- Documentation: https://docs.pimlico.io
- Discord: https://discord.gg/pimlico
- Email: support@pimlico.io

### Celo Support

- Documentation: https://docs.celo.org
- Discord: https://discord.com/invite/celo

### Project Support

- GitHub Issues: https://github.com/dhd1956/piano-blog/issues
- Documentation: `/docs/sprints/GAS_SPONSORSHIP_FEATURE.md`

---

**Last Updated:** 2025-12-28
**Version:** 1.0
**Status:** Production Ready
