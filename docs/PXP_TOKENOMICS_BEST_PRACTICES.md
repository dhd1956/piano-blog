# PXP Tokenomics & Badge System: Best Practices

**Document Version**: 1.0
**Last Updated**: 2026-01-09
**Status**: Recommendations for Implementation

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [PXP Accumulation (Earning)](#pxp-accumulation-earning)
3. [PXP Spending (Utility)](#pxp-spending-utility)
4. [Token Economics](#token-economics)
5. [Badge System](#badge-system)
6. [Implementation Priority](#implementation-priority)
7. [Anti-Gaming Measures](#anti-gaming-measures)
8. [Metrics to Track](#metrics-to-track)

---

## Core Principles

### 1. Create Virtuous Cycles

- **Earning → Spending → Platform Value → More Earning Opportunities**
- Avoid dead-end accumulation (hoarding with no utility)
- Every token earned should have meaningful ways to be spent

### 2. Reward Quality Over Quantity

- Higher rewards for verified/valuable contributions
- Diminishing returns for repetitive actions
- Prevent spam through verification requirements

### 3. Balance Supply & Demand

- Every earn mechanism needs corresponding spend mechanism
- Monitor inflation rate (PXP minted vs burned)
- Create scarcity to maintain value

---

## PXP Accumulation (Earning)

### Tier 1: Core Platform Actions (Currently Defined)

| Action                           | Current | Recommended  | Rationale                                        |
| -------------------------------- | ------- | ------------ | ------------------------------------------------ |
| **New User Welcome**             | 25 PXP  | ✅ 25 PXP    | Fair onboarding reward, one-time only            |
| **Venue Discovery (Scout)**      | 50 PXP  | ✅ 50 PXP    | High value - discovering venues is core activity |
| **Venue Verification (Curator)** | 25 PXP  | ⚠️ 15-20 PXP | Lower than scout to prevent curator favoritism   |

**Why lower curator reward?**
Prevents curators from approving low-quality venues just to earn PXP. Their main incentive should be community reputation.

**Implementation Status**:

- ✅ New User Welcome: Implemented
- ❌ Venue Discovery: Contract ready, frontend not integrated
- ❌ Venue Verification: Contract ready, frontend not integrated

---

### Tier 2: Quality Content (Recommended to Add)

| Action                      | Suggested Reward | Frequency           | Notes                                      |
| --------------------------- | ---------------- | ------------------- | ------------------------------------------ |
| **Write Venue Review**      | 10 PXP           | Once per venue      | Encourages detailed feedback               |
| **Review Upvoted**          | 2 PXP            | Per 5 upvotes       | Rewards quality reviews                    |
| **Upload Event Video**      | 100 PXP          | Per video (YouTube) | High effort, high value content ✅ Planned |
| **Video Reaches 1K Views**  | 150 PXP          | Milestone           | Rewards viral content ✅ Planned           |
| **Video Reaches 10K Views** | 200 PXP          | Milestone           | Rewards exceptional content ✅ Planned     |

**Implementation Notes**:

- Review rewards require upvote/reaction system
- Video rewards already planned in WPB-303
- Consider fraud detection for view count manipulation

---

### Tier 3: Community Building

| Action                           | Suggested Reward | Frequency                       | Anti-Gaming Measure        |
| -------------------------------- | ---------------- | ------------------------------- | -------------------------- |
| **Refer New User**               | 25 PXP           | When referral completes profile | ✅ Already planned         |
| **Host Event**                   | 50 PXP           | Per event with 5+ attendees     | Prevents fake events       |
| **Attend Event**                 | 5 PXP            | Max 2 events/week               | Prevent spam attendance    |
| **Verify Profile (Photo + Bio)** | 15 PXP           | One-time                        | Reduces anonymous accounts |

**Referral System Details**:

- Reward only when referred user:
  - Creates account
  - Verifies email OR connects wallet
  - Earns their first PXP (proves active engagement)

---

### Tier 4: Platform Governance (Future)

| Action                  | Suggested Reward | Notes                          |
| ----------------------- | ---------------- | ------------------------------ |
| **Vote on Proposal**    | 5 PXP            | For DAO governance             |
| **Successful Proposal** | 100 PXP          | If community accepts your idea |

---

## PXP Spending (Utility)

**CRITICAL**: Without spending mechanisms, PXP becomes meaningless. Strong utility is essential.

### Tier 1: Social/Tipping (HIGH PRIORITY) ⭐⭐⭐

| Feature                | Cost                   | Why This Works                          |
| ---------------------- | ---------------------- | --------------------------------------- |
| **Tip Musician**       | Variable (10-1000 PXP) | Direct value transfer, emotional reward |
| **Tip Venue**          | Variable (10-500 PXP)  | Thank venues for great pianos           |
| **Boost Review**       | 50 PXP                 | Make your review featured for 7 days    |
| **Gift PXP to Friend** | Variable               | Social bonding                          |

**Implementation Priority**: **CRITICAL**
Without this, PXP has no real utility beyond display.

**Technical Requirements**:

- Smart contract function: `transfer(address to, uint256 amount)`
- Frontend UI for entering recipient + amount
- Transaction confirmation modal
- Success/failure notifications
- Activity feed showing tips sent/received

---

### Tier 2: Profile/Visibility

| Feature                           | Cost    | Duration                     | Why This Works                    |
| --------------------------------- | ------- | ---------------------------- | --------------------------------- |
| **Featured Musician (Directory)** | 100 PXP | 30 days                      | Musicians want gigs/visibility    |
| **Verified Checkmark**            | 200 PXP | Permanent                    | Status symbol, trust signal       |
| **Custom Profile Theme**          | 75 PXP  | Permanent                    | Personalization drives engagement |
| **Profile Badge Slot**            | 50 PXP  | Unlock 1 extra badge display | Flex achievements                 |

**Implementation Notes**:

- Featured musicians appear at top of `/musicians` page
- Verified checkmark ≠ role verification (this is cosmetic)
- Profile themes require CSS customization system

---

### Tier 3: Event/Venue Features

| Feature                    | Cost                    | Why This Works                            |
| -------------------------- | ----------------------- | ----------------------------------------- |
| **Promote Event**          | 150 PXP                 | Event pinned to top of /events for 7 days |
| **Venue Spotlight**        | 200 PXP                 | Featured on homepage for 3 days           |
| **Event Recording Upload** | Free (earn PXP instead) | Incentivize content creation              |

---

### Tier 4: Premium Features (Future)

| Feature                 | Cost           | Model                              |
| ----------------------- | -------------- | ---------------------------------- |
| **Analytics Dashboard** | 500 PXP/year   | See who viewed your profile/venues |
| **Direct Messaging**    | 100 PXP/month  | Connect with musicians privately   |
| **Event Ticket Sales**  | 10% fee in PXP | Monetization for hosts             |

---

## Token Economics

### Current Problem: ⚠️ Inflation Risk

**Current Setup**:

- **Mint**: 1M PXP initial + unlimited minting
- **Burn**: None
- **Spending**: Not implemented

**Result**: Hyperinflation → PXP becomes worthless

---

### Recommended Economic Model

#### Option A: Fixed Supply with Burn (Recommended)

```
Initial Supply: 1,000,000 PXP
Minting: Disabled after distribution
Burning: 10% of all spending burned permanently

Example:
- User tips musician 100 PXP
- Musician receives: 90 PXP
- Burned: 10 PXP (destroyed forever)
- Total supply decreases over time (deflationary)
```

**Why this works**:

- ✅ Creates scarcity (good for value)
- ✅ Rewards early adopters
- ✅ Sustainable long-term
- ✅ Simple to implement

**Implementation**:

```solidity
function tipUser(address recipient, uint256 amount) external {
    uint256 burnAmount = amount / 10; // 10%
    uint256 recipientAmount = amount - burnAmount;

    _transfer(msg.sender, recipient, recipientAmount);
    _burn(msg.sender, burnAmount);
}
```

---

#### Option B: Capped Inflation with Burn

```
Max Supply: 10,000,000 PXP
Yearly Mint: Max 5% of current supply
Burning: 20% of all spending

Example Year 1:
- Start: 1M PXP
- Earned: 50k PXP (5% inflation)
- Burned: 30k PXP (from spending)
- Net: +20k PXP (2% net inflation)
```

**Why this works**:

- ✅ Allows growth rewards
- ✅ Controlled inflation
- ✅ Balances new user rewards vs value preservation
- ⚠️ More complex to manage

---

### Burn Mechanism Examples

#### Platform Fees (10% burn)

- User tips: 10% burned
- Featured listings: 10% burned
- Profile customizations: 10% burned

#### Transaction Tax (Alternative)

- Every PXP transfer: 1% burned
- Encourages holding vs frequent trading
- Simpler but less transparent

**Recommendation**: Platform fees with 10% burn (more transparent, fairer)

---

## Badge System

### Philosophy: Badges ≠ PXP

| Aspect           | Badges                 | PXP                    |
| ---------------- | ---------------------- | ---------------------- |
| **Nature**       | Reputation/Status      | Currency               |
| **Transferable** | ❌ No (soul-bound)     | ✅ Yes                 |
| **Earned by**    | Achievements           | Contributions          |
| **Spent on**     | Nothing (display only) | Platform features      |
| **Scarcity**     | Fixed by achievement   | Economic supply/demand |

---

### Badge Categories

#### 1. Role Badges (Automatic)

| Badge               | Requirement                       | Icon | Automatic?          |
| ------------------- | --------------------------------- | ---- | ------------------- |
| `verified_curator`  | Granted CURATOR role              | ✅   | Yes                 |
| `verified_musician` | Profile verified with video proof | 🎹   | No (manual review)  |
| `venue_owner`       | Verified venue ownership          | 🤝   | No (requires proof) |

**Implementation**: Trigger when user role changes

```javascript
// In scripts/set-user-role.mjs or app/api/admin/curators/route.ts
if (role === 'CURATOR' || role === 'BLOG_OWNER') {
  await prisma.user.update({
    where: { walletAddress },
    data: {
      badges: { push: 'verified_curator' },
    },
  })
}
```

---

#### 2. Achievement Badges (Milestone-based)

| Badge             | Requirement              | Icon | Rarity               | Auto-Award? |
| ----------------- | ------------------------ | ---- | -------------------- | ----------- |
| `early_adopter`   | First 100 users          | 🌟   | Rare (fixed supply)  | Yes         |
| `top_scout`       | 10+ verified venues      | 🔍   | Uncommon (~5% users) | Yes         |
| `venue_master`    | 50+ verified venues      | 🗺️   | Rare (~1% users)     | Yes         |
| `reviewer`        | 10+ reviews              | ✍️   | Common (~20% users)  | Yes         |
| `critic`          | 50+ reviews              | 📝   | Uncommon (~5% users) | Yes         |
| `event_host`      | Hosted 5+ events         | 🎤   | Common               | Yes         |
| `content_creator` | 10+ videos uploaded      | 📹   | Uncommon             | Yes         |
| `viral_star`      | Video reached 100K views | ⭐   | Rare                 | Yes         |

**Implementation Example** (Top Scout):

```javascript
// In app/api/venues/[id]/route.ts (when venue is verified)
const venueCount = await prisma.venue.count({
  where: {
    submittedBy: venueScoutAddress,
    verified: true,
  },
})

if (venueCount === 10 && !user.badges.includes('top_scout')) {
  await prisma.user.update({
    where: { walletAddress: venueScoutAddress },
    data: {
      badges: { push: 'top_scout' },
    },
  })
  // Trigger notification: "Achievement unlocked: Top Scout!"
}
```

---

#### 3. Community Badges (Manual Grant by Blog Owner)

| Badge                | Criteria                    | Why Manual                           |
| -------------------- | --------------------------- | ------------------------------------ |
| `piano_virtuoso`     | Professional pianist        | Requires verification of credentials |
| `community_champion` | Outstanding contributions   | Subjective judgment needed           |
| `venue_partner`      | Official venue relationship | Business partnership verification    |

**Admin Interface**: `/admin/badges` page to manually grant these

---

#### 4. Seasonal/Special Badges (Limited Time)

| Badge               | Event                       | Availability     |
| ------------------- | --------------------------- | ---------------- |
| `founding_member`   | Mainnet launch              | First month only |
| `holiday_performer` | Performed at holiday event  | Dec 2025 only    |
| `jam_master_2026`   | Won jam session competition | Annual           |

**Purpose**: Create urgency and FOMO (Fear of Missing Out)

---

### Badge Display Priority

When user has many badges, show in this order:

1. **Rarest first** (early_adopter, viral_star, seasonal)
2. **Role badges** (curator, musician, venue_owner)
3. **Achievement badges** (by recency earned)

---

### Badge Economics: Should Badges Cost PXP?

**Recommendation**: ❌ **No**

- Badges should be **earned through actions**, not purchased
- Purchasing diminishes prestige
- Exception: Cosmetic variations okay (e.g., "gold verified checkmark" = 200 PXP, but doesn't grant curator powers)

---

## Anti-Gaming Measures

### Threat Modeling

| Risk                   | Attack Vector                                      | Solution                                                             |
| ---------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| **Sybil Attacks**      | Create 100 fake accounts to claim new user rewards | Email verification + wallet connect OR minimum activity threshold    |
| **Venue Spam**         | Submit 50 fake venues to earn scout rewards        | Curator verification required; scout reward only after 2-3 approvals |
| **Review Spam**        | Write 100 reviews for the same venue               | Max 1 review per venue per user                                      |
| **Event Spam**         | Create fake events to earn hosting rewards         | Require 5+ unique attendees (verified accounts)                      |
| **Curator Corruption** | Curators approve friend's low-quality venues       | Lower curator rewards, community appeal process, audit trail         |
| **Referral Farming**   | Create fake accounts via referral links            | Referral reward only when referred user earns first PXP              |
| **Vote Manipulation**  | Upvote own reviews with fake accounts              | Require minimum account age + PXP balance to vote                    |

---

### Implementation Requirements

#### Account Verification Levels

1. **Level 0: Anonymous** (just wallet)
   - Can browse, view content
   - Cannot earn PXP

2. **Level 1: Email Verified**
   - Can earn limited PXP (max 100 PXP/month)
   - Can submit venues (pending curator approval)
   - Can write reviews

3. **Level 2: Wallet + Email + Active**
   - Unlimited PXP earning
   - All features unlocked
   - Requires: 7+ days old account, 3+ contributions

#### Rate Limiting

```javascript
// Example: Limit venue submissions
const recentSubmissions = await prisma.venue.count({
  where: {
    submittedBy: userAddress,
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    },
  },
})

if (recentSubmissions >= 5) {
  throw new Error('Maximum 5 venue submissions per 24 hours')
}
```

---

## Implementation Priority

### Phase 1: Foundation (Do First) ⭐⭐⭐

**Goal**: Enable core earning loop and fix inflation

1. ✅ **Enable Scout Rewards** (50 PXP after 2-3 curator approvals)
   - File: `app/api/venues/[id]/route.ts`
   - Trigger: When `verified` changes from `false` to `true`
   - Award to: `venue.submittedBy` address

2. ✅ **Enable Curator Rewards** (15-20 PXP per verification)
   - File: `app/api/venues/[id]/route.ts`
   - Trigger: When curator approves/rejects venue
   - Award to: Current user (curator)

3. ✅ **Automatic Badge Awarding**
   - `verified_curator`: When role set to CURATOR
   - `top_scout`: When verified venues >= 10
   - `early_adopter`: First 100 users

4. ⚠️ **Add Burn Mechanism** (10% of tips burned)
   - Modify smart contract: Add burn to `transfer()` function
   - Or implement in app layer (less secure)

**Estimated Time**: 6-8 hours
**Priority**: Critical for token economics

---

### Phase 2: Utility (Critical) ⭐⭐⭐

**Goal**: Give PXP real value through spending

5. ✅ **User Tipping**
   - UI: Modal to enter recipient + amount
   - Smart contract: `transfer(address, amount)` with 10% burn
   - Notification: Toast showing tip sent/received

6. ✅ **Venue Tipping**
   - UI: "Tip This Venue" button on venue details page
   - Recipient: `venue.submittedBy` address
   - Same burn mechanism

7. ✅ **Featured Musician** (100 PXP/30 days)
   - Database: Add `featuredUntil` timestamp to User table
   - UI: Featured section at top of `/musicians` page
   - Payment: Burn PXP + set timestamp

**Estimated Time**: 10-12 hours
**Priority**: Critical - Without spending, PXP is worthless

---

### Phase 3: Engagement (High Value) ⭐⭐

**Goal**: Increase user retention and content quality

8. ✅ **Review Rewards** (10 PXP per review)
   - Trigger: When review submitted
   - Limit: 1 review per venue per user

9. ✅ **Event Hosting Rewards** (50 PXP with 5+ attendees)
   - Trigger: 7 days after event ends
   - Validation: Count unique RSVPs with status = CONFIRMED

10. ✅ **Badge Milestones**
    - `venue_master` (50 venues)
    - `critic` (50 reviews)
    - `event_host` (5 events)

**Estimated Time**: 8-10 hours
**Priority**: High - Drives engagement

---

### Phase 4: Advanced (Future) ⭐

11. Premium features (analytics, DMs)
12. Governance voting
13. Seasonal badges and competitions

---

## Metrics to Track

### Health Indicators

| Metric              | Target                       | Red Flag | Action if Red Flag                         |
| ------------------- | ---------------------------- | -------- | ------------------------------------------ |
| **Earn/Burn Ratio** | 1.0-1.2                      | > 2.0    | Reduce rewards or increase burn rate       |
| **Active Earners**  | 30%+ of users                | < 10%    | Increase reward visibility, lower barriers |
| **Active Spenders** | 20%+ of earners              | < 5%     | Add more spending options, improve UX      |
| **Badge Rarity**    | Top badges < 5% of users     | > 20%    | Increase requirements or add new tiers     |
| **PXP Velocity**    | PXP changes hands 2-3x/month | < 1x     | Incentivize tipping, reduce hoarding       |

---

### Analytics Dashboard (Recommended)

**Location**: `/admin/tokenomics`

**Metrics to Display**:

1. **Supply**
   - Total PXP minted (all-time)
   - Total PXP burned (all-time)
   - Current circulating supply

2. **Activity**
   - PXP earned (last 30 days)
   - PXP spent (last 30 days)
   - Unique earners (last 30 days)
   - Unique spenders (last 30 days)

3. **Distribution**
   - Top 10 holders (wallet + balance)
   - Median PXP balance
   - Gini coefficient (inequality measure)

4. **Engagement**
   - New users claiming welcome reward
   - Venues submitted → verified (conversion rate)
   - Reviews written
   - Events hosted

**Implementation**:

- Daily cron job to snapshot metrics
- Store in `PXPMetrics` table
- Display charts using Recharts or Chart.js

---

## Red Flags to Avoid

### ❌ Don't Do This

1. **Sell PXP directly for fiat** - Ruins decentralization, creates pay-to-win
2. **Allow PXP → Fiat conversion** - Regulatory nightmare, changes incentives
3. **Award PXP for low-effort actions** - Devalues token (e.g., "login daily for 1 PXP")
4. **Make badges purchasable** - Destroys reputation value
5. **No spending mechanisms** - PXP becomes worthless points
6. **Unlimited minting** - Hyperinflation kills value
7. **No anti-gaming measures** - Bots farm all rewards

---

### ✅ Do This

1. **Earn through value creation** - Venues, reviews, events, content
2. **Spend on platform value** - Tips, visibility, features
3. **Burn to create scarcity** - Deflationary pressure maintains value
4. **Badges for achievements** - Milestone-based, rare
5. **Monitor inflation** - Track PXP minted vs burned monthly
6. **Prevent gaming** - Verification, rate limits, minimum thresholds
7. **Transparent governance** - Multi-sig for reward changes

---

## Summary: Recommended Configuration for GlobalPiano.Network

### PXP Earning (Priority Order)

1. ✅ **Scout reward**: 50 PXP (after 2 curator approvals) - **HIGH PRIORITY**
2. ✅ **Curator reward**: 15-20 PXP (per verification) - **HIGH PRIORITY**
3. ✅ **New user**: 25 PXP (current, keep as-is)
4. ➕ **Review reward**: 10 PXP (per quality review) - **MEDIUM PRIORITY**
5. ➕ **Event host**: 50 PXP (with 5+ attendees) - **MEDIUM PRIORITY**
6. ➕ **Referral**: 25 PXP (when referral activates) - **LOW PRIORITY**

---

### PXP Spending (Priority Order)

1. 🎯 **Tip musicians** - Variable amount - **CRITICAL**
2. 🎯 **Tip venues** - Variable amount - **CRITICAL**
3. 🌟 **Featured musician** (100 PXP/month) - **HIGH PRIORITY**
4. 🔖 **Boost review** (50 PXP/week) - **MEDIUM PRIORITY**
5. ✨ **Custom profile theme** (75 PXP) - **LOW PRIORITY**

---

### Badges (Auto-Award)

1. ✅ `verified_curator` - When role = CURATOR
2. ✅ `top_scout` - When verified venues >= 10
3. ✅ `early_adopter` - First 100 users
4. ➕ `reviewer` - 10+ reviews
5. ➕ `event_host` - 5+ events hosted

---

### Economics

- **Model**: Fixed 1M supply + 10% burn on spending (deflationary)
- **Anti-gaming**: Curator approval required for scout rewards
- **Monitoring**: Monthly PXP mint/burn dashboard at `/admin/tokenomics`

---

## Next Steps

1. Review this document with team
2. Decide on economic model (Option A vs B)
3. Prioritize implementation phases
4. Create issues in project tracker (e.g., JIRA)
5. Begin Phase 1 implementation

---

## Related Documents

- [PXP_EPIC.md](./PXP_EPIC.md) - Original user stories and features
- [PXP_REWARDS_MVP.md](./PXP_REWARDS_MVP.md) - Current implementation status
- Smart Contract Governance Plan - See `/home/ave/.claude/plans/enchanted-noodling-rossum.md`

---

**Document Maintainer**: Claude Code
**Last Review**: 2026-01-09
**Next Review**: After Phase 1 implementation
