# Sprint 2 Feature Documentation: Wallet Linking, PXP Expansion & Gas Sponsorship

## Executive Summary

This document outlines **three interconnected features** that together create a complete wallet/PXP adoption funnel for the Global Piano Network:

1. **Gas Sponsorship** (2-3 days, $25-30/month) - ⭐ **QUICK WIN - IMPLEMENT FIRST**
2. **Proactive Wallet Linking** (5-7 days) - Encourage wallet adoption
3. **Expanded PXP Earning** (2-3 weeks) - Maximize engagement

**Why Gas Sponsorship First?**

- Removes #1 barrier to wallet adoption (gas fees)
- Unlocks value of existing wallet users immediately
- Makes Features 2 & 3 drastically more effective
- Minimal effort, massive impact (73% fewer onboarding steps)
- Very low cost at scale ($0.30/user/month)

**Combined Impact:**

- User journey: 8 steps → 3 steps (73% reduction)
- Time to first transaction: 10 minutes → 30 seconds (80% reduction)
- Projected wallet linking rate: <10% → 40% (4x increase)
- Monthly cost: $25-30 for 100 daily active users

**Recommended Implementation Order:**

1. Week 1: Gas Sponsorship (WPB-500) - Unlock wallet usage
2. Week 2: Wallet Linking (WPB-300) - Drive adoption
3. Weeks 3-4: PXP Expansion (WPB-400) - Maximize earning potential
4. Week 5: Testing & Optimization

---

## Overview

This document outlines three major enhancements to the Global Piano Network for Sprint 2 that work together to create a seamless wallet/PXP experience:

1. **Gas Sponsorship** - Remove transaction fee friction for wallet users (Quick Win) ⭐
2. **Proactive Wallet Linking System** - Help users discover and link wallets for PXP rewards
3. **Expanded PXP Earning Opportunities** - New ways to earn PXP beyond venue submissions

---

## Feature 1: Proactive Wallet Linking System

### Problem Statement

Username/password users earn PXP but don't know they need to link a wallet to claim rewards. Current wallet linking is hidden in:

- Profile page (must visit own profile)
- Welcome banner (only for new users)
- Account settings (must know where to look)

**Result:** Low wallet linking rate, users lose PXP rewards

### Proposed Solution

Multi-touch wallet linking prompts that encourage (but don't force) users to link wallets:

#### Touchpoint 1: Dashboard Persistent Card

- **When:** Always visible for users with PXP but no wallet
- **Design:** Card showing pending PXP with "Link Wallet to Earn" CTA
- **Behavior:** Dismissible for 30 days, re-appears if more PXP earned

#### Touchpoint 2: First PXP Celebration Toast

- **When:** User earns their first PXP
- **Design:** Celebratory toast: "🎉 You earned 50 PXP! Link wallet to claim"
- **Behavior:** Shows once, auto-dismisses, opens wallet modal on click

#### Touchpoint 3: Profile Setup Banner

- **When:** Incomplete profile
- **Design:** Add "Link Wallet (Optional)" to existing ProfileSetupBanner
- **Behavior:** Doesn't count toward completion %, shows benefit

### Implementation Components

**New Files:**

- `/components/wallet/WalletLinkingPromptCard.tsx` - Dashboard card
- `/components/wallet/WalletLinkingToast.tsx` - First PXP toast
- `/app/api/profile/dismiss-wallet-prompt/route.ts` - Dismissal endpoint

**Database Changes:**

```prisma
model User {
  walletLinkingPromptDismissedAt DateTime?
  walletLinkingPromptShownCount  Int @default(0)
  firstPXPEarnedAt               DateTime?
}
```

**Modified Files:**

- `/app/dashboard/page.tsx` - Integrate card
- `/components/profile/ProfileSetupBanner.tsx` - Add wallet option
- PXP-earning endpoints - Track first PXP event

### Success Metrics

- Wallet linking conversion rate (target: 40% of PXP earners)
- Average time from first PXP to wallet link
- Dismissal rate by touchpoint
- PXP claimed vs pending ratio

### Effort Estimate

**5-7 days** (1 developer)

### Priority

**High** - Directly impacts PXP ecosystem adoption

---

## Feature 2: Expanded PXP Earning Opportunities

### Current PXP Sources

Currently, users earn PXP only for:

- Venue submissions (50 PXP)
- Event creation (25 PXP)
- Reviews (10 PXP)

### New PXP Sources

#### 2.1 YouTube Video Uploads

**Action:** Upload performance video to YouTube and share on profile

**PXP Award:** 100 PXP per video

- 150 PXP if video reaches 1,000 views
- 200 PXP if video reaches 10,000 views

**Verification:**

- User submits YouTube URL
- System verifies channel ownership (YouTube API)
- Tracks view milestones
- Awards PXP on verification + milestones

**Implementation:**

```prisma
model YouTubeVideo {
  id            Int      @id @default(autoincrement())
  userId        Int
  user          User     @relation(fields: [userId], references: [id])
  youtubeUrl    String
  youtubeId     String   @unique
  title         String
  viewCount     Int      @default(0)
  pxpAwarded    Int      @default(0)
  verifiedAt    DateTime?
  lastChecked   DateTime?
  createdAt     DateTime @default(now())
}
```

**API Endpoints:**

- `POST /api/content/youtube/submit` - Submit YouTube URL
- `GET /api/content/youtube/verify` - Verify ownership (OAuth flow)
- `CRON /api/content/youtube/check-milestones` - Update view counts, award PXP

**Components:**

- `components/content/YouTubeUploadForm.tsx` - Upload interface
- `components/content/YouTubeVerification.tsx` - OAuth verification
- `components/profile/YouTubeVideos.tsx` - Display on profile

#### 2.2 Musician Referrals

**Action:** Refer a musician who subsequently performs at an event

**PXP Award:**

- 50 PXP when referred musician creates profile
- 100 PXP when referred musician performs at first event
- 25 PXP for each subsequent event (up to 10 events = 250 PXP max)

**Referral Flow:**

1. User generates unique referral link: `pianostyle.com/join?ref={userId}`
2. Referred musician signs up via link
3. System tracks relationship in `Referral` table
4. Award PXP on profile creation
5. Award PXP on event performances

**Implementation:**

```prisma
model Referral {
  id              Int       @id @default(autoincrement())
  referrerId      Int
  referrer        User      @relation("ReferralsMade", fields: [referrerId], references: [id])
  referredUserId  Int       @unique
  referredUser    User      @relation("ReferredBy", fields: [referredUserId], references: [id])
  pxpAwarded      Int       @default(0)
  eventsAttended  Int       @default(0)
  createdAt       DateTime  @default(now())

  @@unique([referrerId, referredUserId])
}

model User {
  referralsMade   Referral[] @relation("ReferralsMade")
  referredBy      Referral?  @relation("ReferredBy")
  referralCode    String     @unique @default(cuid())
}
```

**API Endpoints:**

- `GET /api/referrals/code` - Get user's referral link
- `POST /api/auth/signup?ref={code}` - Track referral on signup
- `POST /api/events/{id}/rsvp` - Award PXP when referred user attends event

**Components:**

- `components/referrals/ReferralLinkCard.tsx` - Share referral link
- `components/referrals/ReferralStats.tsx` - Show referral stats
- `components/profile/ReferralBadge.tsx` - "Referred by {user}" badge

#### 2.3 Future PXP Sources (Backlog)

- **Social Media Shares:** 10 PXP per share (Twitter, Facebook, Instagram)
- **Blog Post Creation:** 200 PXP per published blog post
- **Community Moderation:** 50 PXP per week for active moderators
- **Translation Contributions:** 100 PXP per language translated
- **Bug Reports:** 25-100 PXP based on severity

### Combined PXP Ecosystem View

**Total Earning Potential (Monthly):**

- Venue submissions: 4 × 50 = 200 PXP
- Event creation: 2 × 25 = 50 PXP
- Reviews: 10 × 10 = 100 PXP
- YouTube videos: 2 × 100 = 200 PXP
- Referrals: 3 × 150 = 450 PXP
- **Total: ~1,000 PXP/month** for active users

**PXP Value Proposition:**

- 1 PXP = $0.01 USD (target)
- 1,000 PXP = $10 USD/month
- Claimable on-chain via wallet

---

## Feature 3: Gas Sponsorship (Quick Win - High Impact)

### Problem Statement

**Current UX Pain Points:**

Users who link wallets face significant friction:

- ❌ Must understand gas fees
- ❌ Must hold CELO tokens before interacting
- ❌ Can run out of gas mid-transaction
- ❌ Friction prevents casual users from engaging

**User Quote:**

> "Something that another person has mentioned doing is having the wallet payments for regular traffic paid by the system (blog-owner) given that the cost is very small (pennies per use)."

**Impact on Wallet Linking:**

- Even after users link wallets (Feature 1), they face 4-step onboarding vs 2-step
- High abandonment rate when users realize they need CELO tokens
- Poor UX compared to Web2 expectations
- **Result:** Low wallet usage even when linked

### Proposed Solution: Reown AppKit Paymaster

Use Reown AppKit's built-in account abstraction with Pimlico/Biconomy paymaster to sponsor gas fees.

**Why This Solution:**

- ✅ Already using Reown AppKit (infrastructure in place)
- ✅ Email/social login users already get smart contract wallets
- ✅ Minimal code changes required (2-3 days)
- ✅ External service handles complexity
- ✅ Easy to set spending limits and policies
- ✅ Battle-tested, production-ready

### Cost Analysis

**Transaction Costs on Celo:**

| Action             | Gas Cost | Daily Volume (Est.)  | Daily Cost     |
| ------------------ | -------- | -------------------- | -------------- |
| Venue Submission   | $0.02    | 10 submissions       | $0.20          |
| Venue Verification | $0.01    | 20 verifications     | $0.20          |
| Event RSVP         | $0.005   | 50 RSVPs             | $0.25          |
| Profile Update     | $0.01    | 20 updates           | $0.20          |
| **Total**          | -        | **100 transactions** | **~$0.85/day** |

**Monthly Cost:**

- 100 Daily Active Users: **$25-30/month**
- 500 Daily Active Users: $125-150/month
- 1000 Daily Active Users: $250-300/month

**Conclusion:** Extremely affordable, even at scale.

### Implementation Plan

#### Phase 1: Setup & Configuration (Day 1)

**1. Sign up for Paymaster Service**

- Create account at Pimlico.io (recommended) or Biconomy
- Get API key
- Fund account with CELO (~$100 initial deposit)
- Configure spending limits ($50/month max initially)

**2. Environment Variables**

```bash
NEXT_PUBLIC_PIMLICO_API_KEY=your_api_key_here
NEXT_PUBLIC_PAYMASTER_URL=https://api.pimlico.io/v2/celo-sepolia/rpc
```

#### Phase 2: Reown Configuration (Day 1-2)

**1. Update Reown AppKit Config**

File: `config/reown.tsx`

```typescript
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  // Add account abstraction with gas sponsorship
  accountAbstraction: {
    sponsorGas: true,
    paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,
    paymasterContext: {
      // Sponsor specific methods only
      sponsoredMethods: [
        'submitVenue',
        'verifyVenue',
        'rsvpToEvent',
        'updateProfile',
        'createEvent',
      ],
    },
  },
})
```

**2. Update ReownProvider Component**

File: `context/ReownProvider.tsx`

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
    onramp: { enabled: false }, // Disable since gas is sponsored
  },
  paymasterServiceUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,
})
```

#### Phase 3: Transaction Policies (Day 2)

**1. Create Sponsorship Policy Module**

File: `lib/gas-sponsorship.ts`

```typescript
export const sponsorshipPolicies = {
  // Sponsor these contract methods
  sponsoredMethods: ['submitVenue', 'verifyVenue', 'rsvpToEvent', 'updateProfile', 'createEvent'],

  // Rate limits (per user per day)
  rateLimits: {
    submitVenue: 3,
    verifyVenue: 50, // Curators
    rsvpToEvent: 10,
    updateProfile: 5,
    createEvent: 2,
  },

  // Do NOT sponsor
  blockedMethods: ['transfer', 'approve', 'deploy'],
}
```

**2. Implement Rate Limiting**

- Track user transaction counts in database
- Daily reset logic
- Warning UI when approaching limit
- Block transactions exceeding limit

#### Phase 4: UI Updates (Day 2-3)

**1. Remove Gas Fee UI**

Update components to hide gas-related UI:

- Remove "Insufficient gas" warnings
- Remove gas estimation displays
- Hide "Get CELO tokens" prompts

Files to update:

- `app/submit/page.tsx`
- `app/events/create/page.tsx`
- `components/profile/ProfileSetupBanner.tsx`

**2. Add "Sponsored by Platform" Badge**

File: `components/gas/SponsoredBadge.tsx`

```typescript
export default function SponsoredBadge() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm dark:bg-green-900/20">
      <svg className="h-5 w-5 text-green-600">
        {/* checkmark icon */}
      </svg>
      <span className="text-green-700 dark:text-green-300">
        Transaction fees sponsored by platform
      </span>
    </div>
  )
}
```

#### Phase 5: Monitoring & Testing (Day 3)

**1. Testing**

- Test venue submission (email login user)
- Test event RSVP (Google login user)
- Test profile update (wallet user)
- Verify gas paid by blog owner
- Test rate limiting enforcement
- Test blocked method rejection

**2. Monitoring Dashboard**

File: `app/admin/gas-sponsorship/page.tsx`

Display:

- Total transactions sponsored today/week/month
- Total gas costs
- Cost by transaction type
- Top users by gas consumption
- Rate limit violations
- Paymaster balance

**3. Alerts**

- Email alert when paymaster balance low
- Daily cost summary
- Rate limit violation tracking

### User Experience Impact

**Before (Current):**

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

**After (With Gas Sponsorship):**

```
User Journey: Submit Venue
1. Sign in with Google/Email
2. Submit venue
3. Wait for confirmation

Total: 3 steps, ~30 seconds, seamless!
```

**Impact:**

- ✅ 73% fewer steps
- ✅ No crypto knowledge required
- ✅ Instant onboarding
- ✅ Feels like Web2 app

### Integration with Features 1 & 2

**Synergy:**

1. **Feature 1 (Wallet Linking)** encourages users to link wallets
2. **Feature 2 (PXP Expansion)** gives users reasons to earn PXP
3. **Feature 3 (Gas Sponsorship)** removes friction from using wallet once linked

**Combined User Flow:**

1. User signs up with email/password (Web 2.5 auth)
2. User earns PXP through activities (Feature 2: YouTube, referrals, etc.)
3. System prompts user to link wallet (Feature 1: Dashboard card, toast)
4. User links wallet (one-click via Reown AppKit)
5. User claims PXP rewards (Feature 3: gas sponsored, seamless)
6. User continues earning and claiming (frictionless loop)

### Success Metrics

**User Experience:**

- ⬆️ Conversion rate (signup → first action): Target +50%
- ⬆️ User activation (% completing first transaction): Target +40%
- ⬇️ Time to first transaction: Target -80% (10min → 30sec)
- ⬆️ User retention (7-day): Target +25%

**Cost Metrics:**

- Daily gas cost: Track vs. budget
- Cost per active user: Target <$0.30/user/month
- Transaction efficiency: Monitor gas optimization

**Technical Metrics:**

- Sponsored transaction success rate: Target >98%
- Paymaster uptime: Target >99.5%
- Rate limit effectiveness: Track violations

### Effort Estimate

**2-3 days** (1 developer)

### Priority

**⭐ HIGH IMPACT - Quick Win**

**Rationale:**

- Minimal development effort (already have Reown AppKit)
- Massive UX improvement (8 steps → 3 steps)
- Very low cost ($25-30/month for 100 DAU)
- Directly supports wallet linking adoption (Feature 1)
- Makes PXP claiming seamless (Feature 2)

### Risk Mitigation

**Risk 1: Paymaster Service Downtime**

- Mitigation: Graceful fallback to user-paid gas
- Show toast: "Platform sponsorship unavailable, using your gas"

**Risk 2: Cost Overrun**

- Mitigation: Set hard spending cap ($100/month initially)
- Alert at 75% of budget
- Auto-pause at budget limit

**Risk 3: Abuse/Spam**

- Mitigation: Rate limiting per user
- CAPTCHA for high-volume actions
- Ban repeat offenders
- Monitor patterns

---

## Integrated Implementation Plan

**Recommended Approach:** Implement in parallel streams to maximize velocity

### Phase 1: Quick Win - Gas Sponsorship (Week 1: Days 1-3)

**Priority:** HIGH - Unlocks wallet usage for existing and new users

1. **Day 1: Setup & Config**
   - Sign up for Pimlico/Biconomy
   - Configure environment variables
   - Update Reown AppKit config with paymaster

2. **Day 2: Policies & UI**
   - Create `lib/gas-sponsorship.ts` policy module
   - Implement rate limiting
   - Remove gas fee UI from forms
   - Add "Sponsored by Platform" badges

3. **Day 3: Testing & Monitoring**
   - Test sponsored transactions end-to-end
   - Create monitoring dashboard
   - Set up alerts
   - Deploy to production

**Deliverable:** Users can interact with blockchain without gas fees

---

### Phase 2: Database & API Foundation (Week 1: Days 4-5)

**Parallel to gas sponsorship implementation**

1. Add wallet linking tracking fields to User model
2. Create dismissal API endpoint
3. Update PXP-earning endpoints to track first earn
4. Create YouTube video schema
5. Create referral schema
6. Run database migrations

**Deliverable:** Database ready for wallet linking and PXP expansion

---

### Phase 3: Wallet Linking UI (Week 2)

1. Build WalletLinkingPromptCard component
2. Integrate card into dashboard
3. Build WalletLinkingToast component
4. Update ProfileSetupBanner with wallet option
5. Test dismissal logic
6. A/B test messaging variations

**Deliverable:** Proactive wallet linking prompts live

---

### Phase 4: YouTube Integration (Week 3)

1. YouTube API OAuth integration setup
2. Video submission form component
3. Channel ownership verification flow
4. View count tracking cron job
5. Profile video gallery display
6. PXP award automation

**Deliverable:** Users can earn PXP via YouTube content

---

### Phase 5: Referral System (Week 4)

1. Referral code generation on signup
2. Referral link sharing UI component
3. Signup tracking with referral codes
4. Event attendance PXP awards
5. Referral stats dashboard
6. Anti-fraud monitoring

**Deliverable:** Users can earn PXP by referring musicians

---

### Phase 6: Testing & Analytics (Week 5)

1. End-to-end testing all features
2. Analytics integration (wallet linking, PXP earning, gas usage)
3. Monitor conversion rates and costs
4. Gather user feedback
5. Optimize based on data
6. Document learnings

**Deliverable:** Production-ready feature suite with metrics

---

## Success Metrics & KPIs

### Gas Sponsorship Metrics

- **User activation rate:** +50% (signup → first transaction)
- **Time to first transaction:** -80% reduction (10min → 30sec)
- **Transaction success rate:** >98%
- **Monthly cost per DAU:** <$0.30
- **Paymaster uptime:** >99.5%
- **Rate limit violations:** <1% of users
- **Cost vs. budget:** Track daily, alert at 75%

### Wallet Linking Metrics

- **Wallet linking rate:** 40% of PXP earners (target, up from <10%)
- **Time to first link:** <7 days from first PXP
- **Dismissal rate:** <30% permanent dismissals
- **PXP claimed vs. pending ratio:** >70%

### PXP Earning Metrics

- **Active PXP earners:** 60% of monthly active users
- **Average PXP earned:** 500 PXP/user/month (up from ~150)
- **PXP claimed ratio:** 70% of earned PXP claimed on-chain
- **User retention (7-day):** +25% for PXP earners

### YouTube Metrics

- **Videos submitted:** 50/month (target)
- **Average views:** 1,000 views per video
- **Milestone achievement:** 30% reach 1,000 views
- **PXP awarded via YouTube:** Track total monthly

### Referral Metrics

- **Referral conversion:** 20% of new signups via referral
- **Active referrers:** 100 users making referrals
- **Average referrals:** 3 per referrer
- **Referred user retention:** Track vs. non-referred users

### Overall Ecosystem Health

- **Wallet adoption rate:** Track monthly growth
- **Total PXP in circulation:** Monitor inflation
- **Transaction volume:** Track weekly trends
- **Cost per user acquisition:** Calculate including gas sponsorship

---

## Technical Dependencies

### External Services

1. **Pimlico/Biconomy Paymaster** (Gas Sponsorship)
   - Account required: Pimlico.io or Biconomy
   - Initial funding: ~$100 CELO
   - Monthly cost: $25-30 for 100 DAU
   - API key: Required for production
   - Already have: Reown AppKit infrastructure

2. **YouTube Data API v3** (PXP Expansion)
   - Quota: 10,000 units/day (free tier)
   - OAuth 2.0 setup required
   - Channel verification needed
   - View count tracking: Hourly cron job

3. **Cron Jobs** (Vercel Cron or external)
   - YouTube view count updates: Hourly
   - PXP milestone checks: Daily
   - Gas sponsorship cost monitoring: Daily

### Code Dependencies

- **Existing Infrastructure:**
  - ✅ Reown AppKit v1.8.14+ (already using)
  - ✅ Prisma ORM with PostgreSQL
  - ✅ Next.js 15 App Router
  - ✅ PXP token contract (deployed on Sepolia)

- **New Dependencies (minimal):**
  - No new npm packages required for gas sponsorship
  - YouTube API client (if not already installed)
  - Cron job framework (Vercel Cron or similar)

### Smart Contract Updates (Future)

- PXP token minting for YouTube milestones
- PXP token minting for referral rewards
- Consider batch minting to reduce gas costs (even when sponsored)

---

## User Stories (JIRA)

### Epic: WPB-500 - Gas Sponsorship (Quick Win)

- **WPB-501:** Paymaster service setup and configuration
- **WPB-502:** Update Reown AppKit with account abstraction
- **WPB-503:** Create sponsorship policy module
- **WPB-504:** Implement rate limiting system
- **WPB-505:** Remove gas fee UI from transaction forms
- **WPB-506:** Add "Sponsored by Platform" badge components
- **WPB-507:** Create gas sponsorship monitoring dashboard
- **WPB-508:** Set up cost alerts and monitoring
- **WPB-509:** End-to-end testing of sponsored transactions

### Epic: WPB-300 - Proactive Wallet Linking

- **WPB-301:** Database schema for wallet linking tracking
- **WPB-302:** Dashboard persistent card component
- **WPB-303:** First PXP celebration toast
- **WPB-304:** Profile setup banner enhancement
- **WPB-305:** Dismissal API endpoint
- **WPB-306:** Analytics integration

### Epic: WPB-400 - Expanded PXP Earning

- **WPB-401:** YouTube video submission flow
- **WPB-402:** YouTube OAuth verification
- **WPB-403:** View count tracking & milestone PXP
- **WPB-404:** Referral code generation
- **WPB-405:** Referral tracking on signup
- **WPB-406:** Event attendance PXP for referrals
- **WPB-407:** Referral stats dashboard

---

## Risks & Mitigations

### Gas Sponsorship Risks

**Risk 1: Paymaster Service Downtime**

- **Probability:** Low
- **Impact:** High
- **Mitigation:**
  - Graceful fallback to user-paid gas
  - Show clear toast: "Platform sponsorship unavailable, using your gas"
  - Monitor paymaster uptime in dashboard
  - Have backup paymaster service configured

**Risk 2: Cost Overrun / Budget Exceeded**

- **Probability:** Low
- **Impact:** Medium
- **Mitigation:**
  - Set hard spending cap ($100/month initially)
  - Alert at 75% of budget
  - Auto-pause sponsorship at budget limit
  - Rate limiting per user per day
  - Daily cost monitoring dashboard

**Risk 3: Abuse / Spam Attacks**

- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Rate limiting per user (3 venue submissions/day, etc.)
  - CAPTCHA for high-volume actions
  - IP tracking to detect patterns
  - Ban/throttle repeat offenders
  - Monitor for suspicious transaction patterns

**Risk 4: Gas Price Spikes**

- **Probability:** Low (Celo is very stable)
- **Impact:** Low
- **Mitigation:**
  - Set max gas price limit in paymaster config
  - Monitor gas prices daily
  - Pause sponsorship if gas >10x normal

### Wallet Linking Risks

**Risk 5: Wallet Linking Fatigue**

- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Strict dismissal rules (respect 30-day dismissal)
  - Never show more than one prompt at a time
  - Clear value proposition in all prompts
  - A/B test messaging to optimize

**Risk 6: Low Conversion Despite Prompts**

- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Test multiple messaging variations
  - Show concrete PXP balance ("You have 150 PXP waiting!")
  - Emphasize gas-free claiming (Feature 3 synergy)
  - Iterate based on analytics

### PXP Expansion Risks

**Risk 7: YouTube API Quota Limits**

- **Probability:** Medium
- **Impact:** Low
- **Mitigation:**
  - Cache view counts (update hourly, not per request)
  - Batch API calls efficiently
  - Upgrade to paid quota if needed (~$0.004/10,000 units)
  - Monitor quota usage daily

**Risk 8: Referral Gaming / Abuse**

- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Email verification required for new signups
  - IP tracking to detect duplicate accounts
  - Manual review for suspicious referral patterns
  - Cap referral PXP per user (10 events max = 250 PXP)
  - Require referred user to actually attend events (not just sign up)

**Risk 9: YouTube Verification Fraud**

- **Probability:** Low
- **Impact:** Low
- **Mitigation:**
  - Require OAuth verification (can't fake)
  - Verify channel ownership via YouTube API
  - Check that video is actually piano-related (manual review)
  - Limit PXP awards (100 PXP initial, not excessive)

**Risk 10: PXP Inflation**

- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Monitor total PXP issued vs claimed weekly
  - Set monthly PXP issuance caps
  - Adjust earning rates if inflation detected
  - Consider PXP burning mechanisms (future)
  - Track PXP/USD exchange rate if trading occurs

### Overall Ecosystem Risks

**Risk 11: Low User Adoption Despite All Features**

- **Probability:** Low (features are high-impact)
- **Impact:** High
- **Mitigation:**
  - Measure each feature independently
  - A/B test rollout to cohorts
  - Gather qualitative feedback early
  - Iterate quickly based on data
  - Consider user interviews

**Risk 12: Technical Complexity / Maintenance Burden**

- **Probability:** Low
- **Impact:** Medium
- **Mitigation:**
  - Use managed services (Pimlico, YouTube API)
  - Comprehensive documentation
  - Monitoring/alerting for all systems
  - Graceful degradation when services fail
  - Keep features modular (can disable if needed)

---

## Documentation Locations

**Sprint Planning:**

- `/docs/sprints/SPRINT2_STATUS.md` - Overall sprint status
- `/docs/sprints/SPRINT2_COMPLETION_ROADMAP.md` - Implementation roadmap
- `/docs/sprints/WALLET_LINKING_FEATURE.md` - This document (detailed feature spec)

**API Documentation:**

- `/docs/api/PXP_EARNING_ENDPOINTS.md` - All PXP-awarding endpoints
- `/docs/api/YOUTUBE_INTEGRATION.md` - YouTube API integration
- `/docs/api/REFERRAL_SYSTEM.md` - Referral system API

**User Guides:**

- `/docs/user-guides/EARNING_PXP.md` - How to earn PXP
- `/docs/user-guides/LINKING_WALLET.md` - How to link wallet
- `/docs/user-guides/CLAIMING_REWARDS.md` - How to claim PXP rewards

---

## Open Questions

1. **YouTube verification:** Should we require YouTube channel ownership or just URL submission?
   - **Recommendation:** Require OAuth verification to prevent fraud

2. **Referral PXP split:** Should referred user also get PXP?
   - **Recommendation:** Yes, 50 PXP for joining via referral (both get rewards)

3. **PXP exchange rate:** Keep at $0.01 or dynamic?
   - **Recommendation:** Start fixed, consider dynamic pricing in future

4. **Wallet linking requirement:** Should any features require wallet?
   - **Recommendation:** No, keep optional. PXP accrues even without wallet.

---

## Summary: Why These Three Features Together?

These features create a **complete wallet/PXP adoption loop**:

**The Problem:**

- Username/password users earn PXP but don't know they can claim it → **Feature 1 solves**
- Users who link wallets face gas fee friction → **Feature 3 solves**
- Limited PXP earning opportunities → **Feature 2 solves**

**The Solution:**

1. **Gas Sponsorship (Week 1)** - Remove gas friction FIRST, making wallet usage seamless
2. **Wallet Linking (Week 2)** - Encourage users to link wallets now that it's frictionless
3. **PXP Expansion (Weeks 3-4)** - Give users MORE reasons to earn PXP
4. **Result:** Complete adoption funnel with minimal friction

**Combined Impact:**

- User signs up → Earns PXP via YouTube/referrals → Gets prompted to link wallet → Links wallet (one click) → Claims PXP (gas sponsored, seamless) → Continues earning and claiming in frictionless loop
- **Projected wallet linking rate:** 40% (vs. current <10%)
- **Projected user activation:** +50% (due to gas sponsorship)
- **Cost:** $25-30/month for 100 DAU (negligible)

---

## Implementation Priority Recommendation

**Recommended Order:**

1. **Week 1: Gas Sponsorship** (WPB-500)
   - Quick win, high impact
   - Unlocks wallet usage immediately
   - Benefits existing wallet users right away
   - Enables Features 2 & 3 to succeed

2. **Week 2: Wallet Linking** (WPB-300)
   - Now that gas is sponsored, linking has more value
   - Builds on gas-free experience

3. **Weeks 3-4: PXP Expansion** (WPB-400)
   - YouTube integration
   - Referral system
   - Maximize earning potential

4. **Week 5: Testing & Optimization**
   - Measure impact
   - Optimize conversion
   - Iterate on messaging

**Alternative (Parallel):**

- Stream 1: Gas sponsorship (Week 1) + Wallet linking (Week 2)
- Stream 2: Database/API foundation (Week 1) + PXP expansion (Weeks 2-3)
- Requires 2 developers but delivers all features in 3 weeks

---

## Next Steps

1. **Review & Approval:** Product owner reviews feature specs
2. **JIRA Story Creation:** Create WPB-500, WPB-300, and WPB-400 epics
3. **Paymaster Setup:** Sign up for Pimlico/Biconomy account (critical path)
4. **Design Mockups:** Create UI mockups for new components
5. **Technical Spike:** YouTube API integration proof-of-concept
6. **Sprint Planning:** Add to Sprint 2 backlog (or create dedicated "Wallet/PXP Sprint")
7. **Implementation:** Begin with gas sponsorship (highest impact, lowest effort)

---

## Documentation References

**Existing Documentation:**

- `/docs/sprints/SPRINT2_STATUS.md` - Sprint 2 current status
- `/docs/sprints/GAS_SPONSORSHIP_FEATURE.md` - Detailed gas sponsorship plan
- `/docs/PXP_REWARDS_MVP.md` - Current PXP implementation status

**To Be Created:**

- `/docs/sprints/WALLET_LINKING_FEATURE.md` - This document (move from plan file)
- `/docs/api/PXP_EARNING_ENDPOINTS.md` - All PXP-awarding endpoints
- `/docs/api/YOUTUBE_INTEGRATION.md` - YouTube API integration guide
- `/docs/api/REFERRAL_SYSTEM.md` - Referral system API docs
- `/docs/user-guides/EARNING_PXP.md` - User guide for earning PXP
- `/docs/user-guides/LINKING_WALLET.md` - User guide for linking wallet
- `/docs/user-guides/GAS_FREE_TRANSACTIONS.md` - Explain gas sponsorship to users

---

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Status:** Proposed for Sprint 2
**Estimated Effort:** 5 weeks (1 developer) or 3 weeks (2 developers parallel)
**Priority:** HIGH - Complete wallet/PXP adoption funnel
**Quick Win:** Gas Sponsorship (2-3 days, massive impact)
