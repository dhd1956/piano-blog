# Gas Sponsorship Feature - Planning Document

**Feature:** Sponsor gas fees for user transactions (gasless transactions)
**Status:** 📋 Proposed for Sprint 3
**Priority:** ⭐ HIGH IMPACT - Quick Win
**Estimated Effort:** 2-3 days
**Estimated Cost:** ~$25-30/month (100 daily active users)
**Last Updated:** December 12, 2025

---

## Problem Statement

**Current UX Pain Points:**

- ❌ Users need to understand gas fees
- ❌ Users must hold CELO tokens before interacting
- ❌ Users can run out of gas mid-transaction
- ❌ Friction prevents casual users from engaging

**User Quote:**

> "Something that another person has mentioned doing is having the wallet payments for regular traffic paid by the system (blog-owner) given that the cost is very small (pennies per use)."

**Impact:**

- New users face 4-step onboarding vs 2-step
- High abandonment rate for non-crypto users
- Poor UX compared to Web2 expectations

---

## Proposed Solution

### **Recommendation: Option 1 - Reown AppKit Paymaster** ⭐

Use Reown AppKit's built-in account abstraction with a paymaster service to sponsor gas fees.

**Why This Option:**

- ✅ Already using Reown AppKit (infrastructure in place)
- ✅ Email/social login users already get smart contract wallets
- ✅ Minimal code changes required
- ✅ External service handles complexity (Pimlico/Biconomy)
- ✅ Easy to set spending limits and policies
- ✅ Battle-tested, production-ready

---

## Cost Analysis

### Transaction Costs on Celo

| Action             | Gas Cost | Daily Volume (Est.)  | Daily Cost     |
| ------------------ | -------- | -------------------- | -------------- |
| Venue Submission   | $0.02    | 10 submissions       | $0.20          |
| Venue Verification | $0.01    | 20 verifications     | $0.20          |
| Event RSVP         | $0.005   | 50 RSVPs             | $0.25          |
| Profile Update     | $0.01    | 20 updates           | $0.20          |
| **Total**          | -        | **100 transactions** | **~$0.85/day** |

**Monthly Cost (100 Daily Active Users):** ~$25-30
**Monthly Cost (500 Daily Active Users):** ~$125-150
**Monthly Cost (1000 Daily Active Users):** ~$250-300

**Conclusion:** Extremely affordable, even at scale.

---

## Implementation Options Comparison

### Option 1: Reown AppKit Paymaster ⭐ RECOMMENDED

**How it works:**

- Reown AppKit provides account abstraction (ERC-4337)
- Email/social users get smart contract wallets automatically
- Configure paymaster to sponsor transactions
- Blog owner pays gas in background

**Pros:**

- ✅ Minimal development (2-3 days)
- ✅ Already have infrastructure (Reown AppKit)
- ✅ External service manages complexity
- ✅ Easy spending limits and policies
- ✅ Works out-of-box with email/social login

**Cons:**

- ⚠️ Monthly service fee (free tier available)
- ⚠️ Dependent on external service

**Recommended Paymaster Services:**

1. **Pimlico** - Easiest, good Celo support, generous free tier
2. **Biconomy** - Popular, excellent docs, battle-tested
3. **Stackup** - ERC-4337 focused, competitive pricing

**Effort:** 2-3 days
**Complexity:** Low

---

### Option 2: Celo Native Fee Abstraction

**How it works:**

- Use Celo's built-in `FeeCurrency` feature
- Blog owner pre-funds a gas tank
- Transactions deduct from tank automatically

**Pros:**

- ✅ Native to Celo (no external dependencies)
- ✅ Very cheap
- ✅ Simple implementation

**Cons:**

- ❌ Celo-specific (not portable to other chains)
- ❌ Requires custom contract modifications
- ❌ Less flexible than paymaster

**Effort:** 3-5 days
**Complexity:** Medium

---

### Option 3: Custom Relayer Pattern

**How it works:**

- Run own relayer service
- Users sign messages (free, off-chain)
- Server submits transactions using blog owner wallet

**Pros:**

- ✅ Full control over logic
- ✅ Custom rules (rate limiting, allowlists)
- ✅ Works with regular wallets

**Cons:**

- ❌ Need to run/maintain server
- ❌ Manage private keys securely
- ❌ More development work
- ❌ Operational overhead

**Effort:** 5-7 days
**Complexity:** High

---

## Recommended Implementation Plan (Option 1)

### Phase 1: Setup & Configuration (Day 1)

**Story 1.1: Sign up for Paymaster Service**

- [ ] Create account at Pimlico.io (recommended) or Biconomy
- [ ] Get API key
- [ ] Fund account with CELO (~$100 initial deposit)
- [ ] Configure spending limits ($50/month max)

**Story 1.2: Update Environment Variables**

```bash
# .env.local
NEXT_PUBLIC_PIMLICO_API_KEY=your_api_key_here
NEXT_PUBLIC_PAYMASTER_URL=https://api.pimlico.io/v2/celo-sepolia/rpc
```

---

### Phase 2: Reown Configuration (Day 1-2)

**Story 2.1: Update Reown AppKit Config**

**File:** `config/reown.tsx`

```typescript
import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// Add paymaster configuration
export const paymasterConfig = {
  url: process.env.NEXT_PUBLIC_PAYMASTER_URL || '',
  context: {
    // Sponsor specific methods only
    sponsoredMethods: ['submitVenue', 'verifyVenue', 'rsvpToEvent', 'updateProfile'],
  },
}

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  // Add paymaster support
  accountAbstraction: {
    sponsorGas: true,
    paymasterUrl: paymasterConfig.url,
    paymasterContext: paymasterConfig.context,
  },
})
```

**Story 2.2: Update ReownProvider Component**

**File:** `context/ReownProvider.tsx`

```typescript
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celoSepolia, celo],
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google'],
    emailShowWallets: true,
    // Disable onramp since gas is sponsored
    onramp: { enabled: false },
  },
  // Add paymaster configuration
  paymasterServiceUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,
})
```

**Acceptance Criteria:**

- [x] Paymaster configured in Reown AppKit
- [x] Account abstraction enabled for email/social users
- [x] Onramp disabled (not needed with sponsored gas)

---

### Phase 3: Transaction Policies (Day 2)

**Story 3.1: Implement Sponsorship Rules**

Create file: `lib/gas-sponsorship.ts`

```typescript
/**
 * Gas Sponsorship Policies
 * Define which transactions are sponsored and limits
 */

export const sponsorshipPolicies = {
  // Sponsor these contract methods
  sponsoredMethods: [
    'submitVenue', // Venue submission
    'verifyVenue', // Curator verification
    'rsvpToEvent', // Event RSVP
    'updateProfile', // Profile updates
    'createEvent', // Event creation
  ],

  // Rate limits (per user per day)
  rateLimits: {
    submitVenue: 3, // Max 3 venue submissions per day
    verifyVenue: 50, // Max 50 verifications per day (curators)
    rsvpToEvent: 10, // Max 10 RSVPs per day
    updateProfile: 5, // Max 5 profile updates per day
    createEvent: 2, // Max 2 events per day
  },

  // Do NOT sponsor
  blockedMethods: [
    'transfer', // Token transfers
    'approve', // Token approvals
    'deploy', // Contract deployments
  ],
}

/**
 * Check if transaction should be sponsored
 */
export function shouldSponsorTransaction(method: string, userAddress: string): boolean {
  // Check if method is in sponsored list
  if (!sponsorshipPolicies.sponsoredMethods.includes(method)) {
    return false
  }

  // Check if method is blocked
  if (sponsorshipPolicies.blockedMethods.includes(method)) {
    return false
  }

  // TODO: Check rate limits (implement with Redis or DB)

  return true
}
```

**Story 3.2: Add Rate Limiting**

- [ ] Track user transaction counts in database
- [ ] Implement daily reset logic
- [ ] Add warning UI when approaching limit
- [ ] Block transactions exceeding limit

**Acceptance Criteria:**

- [x] Only whitelisted methods sponsored
- [x] Rate limits prevent abuse
- [x] Blocked methods never sponsored
- [x] User-friendly error messages

---

### Phase 4: User Interface Updates (Day 2-3)

**Story 4.1: Remove Gas Fee UI**

Update components to hide gas-related UI:

- Remove "Insufficient gas" warnings
- Remove gas estimation displays
- Hide "Get CELO tokens" prompts

**Files to update:**

- `app/submit/page.tsx` - Venue submission form
- `app/events/create/page.tsx` - Event creation form
- `components/profile/ProfileSetupBanner.tsx` - Profile setup

**Story 4.2: Add "Sponsored by Platform" Badge**

Create component: `components/gas/SponsoredBadge.tsx`

```typescript
export default function SponsoredBadge() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm dark:bg-green-900/20">
      <svg className="h-5 w-5 text-green-600" /* checkmark icon */>
      <span className="text-green-700 dark:text-green-300">
        Transaction fees sponsored by platform
      </span>
    </div>
  )
}
```

Add to transaction forms where applicable.

**Acceptance Criteria:**

- [x] No gas-related UI shown to users
- [x] Sponsored badge visible on transaction pages
- [x] Clear messaging about free transactions

---

### Phase 5: Testing & Monitoring (Day 3)

**Story 5.1: Test Sponsored Transactions**

- [ ] Test venue submission (email login user)
- [ ] Test event RSVP (Google login user)
- [ ] Test profile update (wallet user)
- [ ] Verify gas paid by blog owner
- [ ] Test rate limiting enforcement
- [ ] Test blocked method rejection

**Story 5.2: Add Monitoring Dashboard**

Create page: `app/admin/gas-sponsorship/page.tsx`

Display:

- Total transactions sponsored today/week/month
- Total gas costs
- Cost by transaction type
- Top users by gas consumption
- Rate limit violations
- Paymaster balance

**Story 5.3: Set Up Alerts**

- [ ] Email alert when paymaster balance low
- [ ] Slack/Discord notification for suspicious activity
- [ ] Daily cost summary
- [ ] Rate limit violation tracking

**Acceptance Criteria:**

- [x] All transaction types tested
- [x] Monitoring dashboard functional
- [x] Alerts configured
- [x] Documentation updated

---

## User Experience Impact

### Before (Current)

```
User Journey: Submit Venue
1. Connect wallet
2. Realize you need CELO tokens
3. Go to exchange/faucet
4. Get CELO
5. Return to app
6. Submit venue
7. Approve gas fee
8. Wait for confirmation

Total: 8 steps, ~10 minutes, high friction
```

### After (With Gas Sponsorship)

```
User Journey: Submit Venue
1. Sign in with Google/Email
2. Submit venue
3. Wait for confirmation

Total: 3 steps, ~30 seconds, seamless!
```

**User Acquisition Impact:**

- ✅ 73% fewer steps
- ✅ No crypto knowledge required
- ✅ Instant onboarding
- ✅ Feels like Web2 app

---

## Risk Analysis

### Technical Risks

| Risk                       | Probability | Impact | Mitigation                         |
| -------------------------- | ----------- | ------ | ---------------------------------- |
| Paymaster service downtime | Low         | High   | Graceful fallback to user-paid gas |
| Gas price spike            | Low         | Medium | Set max gas price limit            |
| Abuse/spam attacks         | Medium      | Medium | Rate limiting + monitoring         |
| Service cost overrun       | Low         | Low    | Spending caps + alerts             |

### Mitigation Strategies

**1. Paymaster Downtime:**

```typescript
// Fallback to user-paid gas if paymaster fails
try {
  await sponsoredTransaction()
} catch (err) {
  if (err.code === 'PAYMASTER_UNAVAILABLE') {
    await userPaidTransaction()
    showToast('Platform sponsorship unavailable, using your gas')
  }
}
```

**2. Cost Control:**

- Set hard spending cap ($100/month initially)
- Alert at 75% of budget
- Auto-pause at budget limit
- Review and adjust monthly

**3. Abuse Prevention:**

- Rate limiting per user
- CAPTCHA for high-volume actions
- Ban repeat offenders
- Monitor patterns

---

## Success Metrics

### Key Performance Indicators (KPIs)

**User Experience:**

- ⬆️ Conversion rate (signup → first action): Target +50%
- ⬆️ User activation (% users completing first transaction): Target +40%
- ⬇️ Time to first transaction: Target -80% (from ~10min to ~30sec)
- ⬆️ User retention (7-day): Target +25%

**Cost Metrics:**

- Daily gas cost: Track vs. budget
- Cost per active user: Target <$0.30/user/month
- Transaction efficiency: Monitor gas optimization

**Technical Metrics:**

- Sponsored transaction success rate: Target >98%
- Paymaster uptime: Target >99.5%
- Rate limit effectiveness: Track violations

---

## Rollout Plan

### Phase 1: Soft Launch (Week 1)

- Enable for dev team only
- Monitor costs closely
- Gather feedback
- Fix any issues

### Phase 2: Limited Beta (Week 2-3)

- Enable for first 50 users
- Announce in community
- Collect user feedback
- Optimize policies

### Phase 3: Full Launch (Week 4+)

- Enable for all users
- Marketing push ("Free transactions!")
- Monitor scale
- Adjust as needed

---

## Alternative Scenarios

### If Budget is Constrained

**Option: Partial Sponsorship**

- Sponsor only first 3 transactions per user (onboarding boost)
- Sponsor only specific actions (e.g., venue submissions only)
- Implement "sponsorship tokens" users can earn

**Option: Tiered Sponsorship**

- Free tier: 10 sponsored transactions/month
- Active user tier: Unlimited sponsored transactions
- Based on community contributions

---

## Documentation Updates Needed

1. **User Docs:**
   - Update "Getting Started" guide (remove gas fee sections)
   - Add "Why transactions are free" explainer
   - FAQ about sponsored transactions

2. **Developer Docs:**
   - Paymaster configuration guide
   - Rate limiting implementation
   - Monitoring dashboard usage

3. **Admin Docs:**
   - Paymaster management guide
   - Cost monitoring procedures
   - Incident response (paymaster failure)

---

## Dependencies

**External Services:**

- Pimlico/Biconomy account and API key
- Sufficient CELO balance in paymaster account

**Code Dependencies:**

- Reown AppKit v1.8.14+ (already using)
- No new npm packages required

**Infrastructure:**

- None (paymaster service handles infrastructure)

---

## Open Questions

- [ ] Should we sponsor ALL transactions or just onboarding actions?
- [ ] What happens when user exceeds rate limit? Block or charge?
- [ ] Should we communicate costs to users (transparency)?
- [ ] How to handle edge case: user wants to pay own gas?
- [ ] Should MetaMask users also get sponsored transactions?

---

## Appendix: Code Examples

### A. Complete Reown Configuration

**File:** `config/reown.tsx`

```typescript
import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo } from '@reown/appkit/networks'
import { http } from 'wagmi'
import type { Chain } from 'wagmi/chains'

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

export const celoSepolia: Chain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { decimals: 18, name: 'CELO', symbol: 'CELO' },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/celo_sepolia'] },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celo-sepolia.blockscout.com' },
  },
  testnet: true,
}

export const networks = [celoSepolia, celo]

export const metadata = {
  name: 'Piano Style Blog',
  description: 'Developing My Piano Style - A blog and venue discovery platform',
  url: 'https://piano-blog.vercel.app',
  icons: ['https://piano-blog.vercel.app/static/favicons/favicon.ico'],
}

// Paymaster configuration
const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL || ''

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia', {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
  },
  // Account abstraction with gas sponsorship
  accountAbstraction: paymasterUrl
    ? {
        sponsorGas: true,
        paymasterUrl,
        paymasterContext: {
          // Sponsor these methods
          sponsoredMethods: [
            'submitVenue',
            'verifyVenue',
            'rsvpToEvent',
            'updateProfile',
            'createEvent',
          ],
        },
      }
    : undefined,
})

export const config = wagmiAdapter.wagmiConfig
```

---

### B. Monitoring Dashboard Example

**File:** `app/admin/gas-sponsorship/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

interface GasMetrics {
  totalTransactions: number
  totalCostToday: number
  totalCostWeek: number
  totalCostMonth: number
  topUsers: Array<{ address: string; cost: number }>
  transactionsByType: Record<string, number>
  paymasterBalance: number
}

export default function GasSponsorshipDashboard() {
  const [metrics, setMetrics] = useState<GasMetrics | null>(null)

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    const response = await fetch('/api/admin/gas-metrics')
    const data = await response.json()
    setMetrics(data)
  }

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Gas Sponsorship Dashboard</h1>

      {/* Cost Summary */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          title="Today"
          value={`$${metrics.totalCostToday.toFixed(2)}`}
          subtitle={`${metrics.totalTransactions} transactions`}
        />
        <MetricCard
          title="This Week"
          value={`$${metrics.totalCostWeek.toFixed(2)}`}
          subtitle="7 days"
        />
        <MetricCard
          title="This Month"
          value={`$${metrics.totalCostMonth.toFixed(2)}`}
          subtitle="30 days"
        />
        <MetricCard
          title="Paymaster Balance"
          value={`$${metrics.paymasterBalance.toFixed(2)}`}
          subtitle={metrics.paymasterBalance < 50 ? '⚠️ Low balance' : '✅ Healthy'}
          alert={metrics.paymasterBalance < 50}
        />
      </div>

      {/* Transactions by Type */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Transactions by Type</h2>
        <div className="space-y-2">
          {Object.entries(metrics.transactionsByType).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span>{type}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Top Users by Gas Consumption</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="pb-2 text-left">Address</th>
              <th className="pb-2 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {metrics.topUsers.map((user) => (
              <tr key={user.address} className="border-b">
                <td className="py-2">{user.address.slice(0, 10)}...{user.address.slice(-8)}</td>
                <td className="py-2 text-right">${user.cost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricCard({ title, value, subtitle, alert = false }: {
  title: string
  value: string
  subtitle: string
  alert?: boolean
}) {
  return (
    <div className={`rounded-lg p-6 shadow ${alert ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'}`}>
      <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="mb-1 text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  )
}
```

---

## Conclusion

Gas sponsorship is a **high-impact, low-effort feature** that dramatically improves user experience at minimal cost. With Reown AppKit infrastructure already in place, implementation is straightforward (2-3 days) and provides immediate value.

**Recommendation:** Implement in Sprint 3 as a **quick win** before tackling larger features.

**Next Steps:**

1. Review and approve this plan
2. Sign up for Pimlico/Biconomy account
3. Begin Phase 1 implementation
4. Monitor costs and adjust policies

---

**Document Owner:** Development Team
**Status:** 📋 Awaiting Approval
**Approved By:** ********\_********
**Approval Date:** ********\_********
