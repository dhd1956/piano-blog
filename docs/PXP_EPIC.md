# PXP Piano Experience Points System - Epic & Stories

## Epic: PXP System Enhancement

**Epic ID**: WPB-300
**Epic Name**: PXP Piano Experience Points Management System
**Epic Summary**: Build comprehensive PXP management features including admin configuration, public leaderboard, and user tipping functionality

**Business Value**:

- Gamify user engagement with piano venues
- Reward community contributions (venue discovery, verification)
- Enable social recognition through leaderboard
- Foster community interaction via tipping

**Success Metrics**:

- Admin can configure PXP reward amounts
- Users can view top PXP earners on leaderboard
- Users can tip PXP to other users and venues
- 80% of active users engage with PXP features within 30 days

---

## User Stories

### Story 1: PXP Admin Configuration Page

**Story ID**: WPB-301
**Story Name**: As an admin, I want to configure PXP reward amounts
**Story Type**: Story
**Priority**: High
**Estimate**: 5 Story Points

**Description**:
As a blog owner/admin, I need a centralized interface to view and configure PXP reward amounts for different actions (new user signup, venue scouting, venue verification) so that I can adjust incentives based on community behavior.

**Acceptance Criteria**:

- [ ] AC1: Admin page accessible only to BLOG_OWNER role at `/admin/pxp-config`
- [ ] AC2: Display current PXP reward amounts from smart contract:
  - New User Reward (default: 25 PXP)
  - Scout Reward (default: 50 PXP)
  - Verifier Reward (default: 25 PXP)
- [ ] AC3: Form to update reward amounts with validation (1-1000 PXP range)
- [ ] AC4: Save button triggers smart contract `setAllRewards()` call
- [ ] AC5: Success/error messages displayed after update
- [ ] AC6: Show last updated timestamp and updater address
- [ ] AC7: Non-admin users redirected to home with error message

**Technical Notes**:

- Use existing `PXPRewardsService.getAllRewards()`
- Use existing `PXPRewardsService.setAllRewards()`
- Smart contract owner check enforced on-chain
- Cache current values in AppConfig table

**Files to Create/Modify**:

- `app/admin/pxp-config/page.tsx`
- `app/api/admin/pxp-config/route.ts`
- `components/admin/PXPConfigForm.tsx`

**Dependencies**: None

**Jira Fields**:

```
Summary: As an admin, I want to configure PXP reward amounts
Issue Type: Story
Priority: High
Story Points: 5
Sprint: [TBD]
Component: Admin, Web3, Smart Contracts
Labels: pxp, admin, configuration, rewards
```

---

### Story 2: Public PXP Leaderboard

**Story ID**: WPB-302
**Story Name**: As a user, I want to view top PXP earners on a leaderboard
**Story Type**: Story
**Priority**: High
**Estimate**: 5 Story Points

**Description**:
As a community member, I want to see who has earned the most PXP so that I can recognize top contributors and be motivated to participate more.

**Acceptance Criteria**:

- [ ] AC1: Leaderboard page accessible at `/leaderboard`
- [ ] AC2: Display top 50 users ranked by `totalCAVEarned`
- [ ] AC3: Each entry shows: Rank (#1, #2, etc.), Avatar, Username, Total PXP, Profile link
- [ ] AC4: Only users with `publicProfile: true` appear on leaderboard
- [ ] AC5: Pagination with "Load More" for ranks 51-100+
- [ ] AC6: Time filter options: All-time (default), This Month, This Week
- [ ] AC7: Navigation link added to header menu
- [ ] AC8: Responsive design for mobile/tablet/desktop
- [ ] AC9: Empty state message if no users have earned PXP yet
- [ ] AC10: Current user's rank highlighted if they're on the leaderboard

**Technical Notes**:

- Query `User` table with `ORDER BY totalCAVEarned DESC`
- Filter: `publicProfile = true AND totalCAVEarned > 0`
- For time filters, join with `CAVPayment` table using `blockTimestamp`
- Cache leaderboard data for 5 minutes (Redis/in-memory)
- Use server component for initial render, client component for filters

**Files to Create/Modify**:

- `app/leaderboard/page.tsx`
- `app/api/leaderboard/route.ts`
- `components/leaderboard/LeaderboardTable.tsx`
- `components/leaderboard/LeaderboardFilters.tsx`
- `data/headerNavLinks.ts` (add link)

**Dependencies**: None

**Jira Fields**:

```
Summary: As a user, I want to view top PXP earners on a leaderboard
Issue Type: Story
Priority: High
Story Points: 5
Sprint: [TBD]
Component: Frontend, Database
Labels: pxp, leaderboard, gamification, social
```

---

### Story 3: User-to-User PXP Tipping

**Story ID**: WPB-303
**Story Name**: As a user, I want to tip PXP to other users
**Story Type**: Story
**Priority**: Medium
**Estimate**: 8 Story Points

**Description**:
As a community member, I want to send PXP tips to other users who have helped me or contributed valuable content so that I can show appreciation and support.

**Acceptance Criteria**:

- [ ] AC1: "Tip PXP" button appears on user profile pages (when viewing others' profiles)
- [ ] AC2: Clicking button opens tip modal with:
  - Recipient's name and avatar
  - Preset amounts: 5, 10, 25, 50 PXP
  - Custom amount input field (1-1000 PXP)
  - Current user's PXP balance displayed
  - Confirm and Cancel buttons
- [ ] AC3: Validation: User cannot tip more than their balance
- [ ] AC4: Validation: User cannot tip themselves
- [ ] AC5: Confirm button triggers MetaMask/wallet connection
- [ ] AC6: Smart contract `transferPXP()` called with recipient and amount
- [ ] AC7: Transaction recorded in `CAVPayment` table with:
  - `paymentType: "tip"`
  - `fromAddress`, `toAddress`, `amount`, `transactionHash`
- [ ] AC8: Recipient's `totalCAVEarned` updated in database
- [ ] AC9: Success message shown with transaction hash link to block explorer
- [ ] AC10: Error handling for failed transactions with retry option
- [ ] AC11: Transaction history visible on profile (optional)

**Technical Notes**:

- Use existing `PXPRewardsService.transferPXP(to, amount)`
- Use existing `CAVPayment` model for recording
- Update recipient `User.totalCAVEarned` via API
- Emit toast notification to recipient (optional - requires websocket)
- Add transaction confirmation modal with gas estimate

**Files to Create/Modify**:

- `components/pxp/TipButton.tsx`
- `components/pxp/TipModal.tsx`
- `app/api/pxp/tip/route.ts`
- `app/profile/[address]/page.tsx` (add button)
- `lib/pxp-service.ts` (helper functions)

**Dependencies**: None

**Jira Fields**:

```
Summary: As a user, I want to tip PXP to other users
Issue Type: Story
Priority: Medium
Story Points: 8
Sprint: [TBD]
Component: Frontend, Web3, Database
Labels: pxp, tipping, social, web3
```

---

### Story 4: Venue PXP Tipping

**Story ID**: WPB-304
**Story Name**: As a user, I want to tip PXP to venues
**Story Type**: Story
**Priority**: Medium
**Estimate**: 5 Story Points

**Description**:
As a pianist, I want to send PXP tips to venues that provide great pianos and atmosphere so that I can show appreciation and encourage more venues to participate.

**Acceptance Criteria**:

- [ ] AC1: "Tip This Venue" button appears on venue detail pages
- [ ] AC2: Button uses same tip modal as user tipping (reusable component)
- [ ] AC3: Preset amounts configurable per venue via `defaultPayment` field
- [ ] AC4: Tips sent to venue's `submittedBy` wallet address (scout who discovered it)
- [ ] AC5: Tip recorded in `CAVPayment` with `venueId` reference
- [ ] AC6: Venue detail page shows "Total PXP Tipped" aggregate
- [ ] AC7: QR code option to tip from mobile (optional)

**Technical Notes**:

- Reuse `TipModal` component from WPB-303
- Query `Venue.submittedBy` to determine recipient
- Aggregate tips: `SUM(amount) WHERE venueId = X AND paymentType = 'tip'`
- Consider adding `totalTipsReceived` to Venue model for performance

**Files to Create/Modify**:

- `app/venues/[slug]/page.tsx` (add button)
- `app/venueDetails/[id]/page.tsx` (add button)
- `components/venues/VenueTipStats.tsx`
- `app/api/venues/[id]/tips/route.ts`

**Dependencies**: WPB-303 (uses shared TipModal component)

**Jira Fields**:

```
Summary: As a user, I want to tip PXP to venues
Issue Type: Story
Priority: Medium
Story Points: 5
Sprint: [TBD]
Component: Frontend, Web3, Venues
Labels: pxp, tipping, venues, web3
```

---

### Story 5: PXP Transaction History

**Story ID**: WPB-305
**Story Name**: As a user, I want to view my PXP transaction history
**Story Type**: Story
**Priority**: Low
**Estimate**: 3 Story Points

**Description**:
As a user, I want to see all my PXP earnings and spending so that I can track my activity and verify transactions.

**Acceptance Criteria**:

- [ ] AC1: "PXP History" tab on user profile page
- [ ] AC2: Display all transactions from `CAVPayment` where user is sender or recipient
- [ ] AC3: Each transaction shows:
  - Date/time
  - Type (Earned/Sent/Received)
  - Amount (+/- PXP)
  - Source (New User Reward, Venue Scout, Tip from User X, etc.)
  - Transaction hash link to block explorer
- [ ] AC4: Transactions sorted by most recent first
- [ ] AC5: Filter by transaction type (All, Earned, Sent, Received)
- [ ] AC6: Pagination (20 per page)
- [ ] AC7: Running balance column showing PXP balance after each transaction

**Technical Notes**:

- Query `CAVPayment WHERE fromAddress = X OR toAddress = X`
- Join with `User` table for sender/recipient names
- Calculate running balance in SQL or application layer
- Consider caching for performance

**Files to Create/Modify**:

- `app/profile/[address]/page.tsx` (add tab)
- `components/profile/PXPHistory.tsx`
- `app/api/pxp/history/route.ts`

**Dependencies**: None

**Jira Fields**:

```
Summary: As a user, I want to view my PXP transaction history
Issue Type: Story
Priority: Low
Story Points: 3
Sprint: [TBD]
Component: Frontend, Database
Labels: pxp, transactions, profile
```

---

### Story 6: PXP Balance Widget

**Story ID**: WPB-306
**Story Name**: As a user, I want to see my current PXP balance in the header
**Story Type**: Story
**Priority**: Low
**Estimate**: 2 Story Points

**Description**:
As a logged-in user, I want to see my current PXP balance in the site header so that I always know how much PXP I have without navigating to my profile.

**Acceptance Criteria**:

- [ ] AC1: PXP balance displayed in header when user is logged in
- [ ] AC2: Shows icon (coin/star) + number (e.g., "⭐ 125 PXP")
- [ ] AC3: Balance updates after earning or spending PXP (real-time or on page refresh)
- [ ] AC4: Clicking balance opens dropdown with:
  - "View History" link → PXP History page
  - "Leaderboard" link → Leaderboard page
  - "Earn More PXP" link → Help page
- [ ] AC5: Balance fetched from database (`User.totalCAVEarned`)
- [ ] AC6: Tooltip on hover shows "Your Piano Experience Points"

**Technical Notes**:

- Add to `components/Header.tsx`
- Fetch balance from session or API call
- Use Next.js Server Component for initial load
- Client component for dropdown interaction
- Consider WebSocket for real-time updates (optional)

**Files to Create/Modify**:

- `components/Header.tsx`
- `components/pxp/PXPBalanceWidget.tsx`
- `app/api/pxp/balance/route.ts`

**Dependencies**: None

**Jira Fields**:

```
Summary: As a user, I want to see my current PXP balance in the header
Issue Type: Story
Priority: Low
Story Points: 2
Sprint: [TBD]
Component: Frontend, UX
Labels: pxp, header, balance, ui
```

---

## Technical Tasks (Spikes/Chores)

### Task 1: PXP Smart Contract Audit

**Task ID**: WPB-307
**Type**: Technical Task
**Priority**: High
**Estimate**: 3 Story Points

**Description**: Review PXP smart contract security before enabling tipping features

**Acceptance Criteria**:

- [ ] Review `transferPXP()` function for reentrancy vulnerabilities
- [ ] Verify access controls on `setAllRewards()`
- [ ] Test edge cases (zero transfers, self-transfers, overflow)
- [ ] Document findings and recommendations

---

### Task 2: Database Indexing for Leaderboard

**Task ID**: WPB-308
**Type**: Technical Task
**Priority**: Medium
**Estimate**: 1 Story Point

**Description**: Add database indexes to optimize leaderboard queries

**Acceptance Criteria**:

- [ ] Add index on `User(totalCAVEarned DESC, publicProfile)`
- [ ] Add index on `CAVPayment(blockTimestamp)` for time-based filters
- [ ] Run EXPLAIN ANALYZE on leaderboard query
- [ ] Verify query performance < 100ms for top 50 users

---

## Story Dependencies Graph

```
WPB-301 (Admin Config) ─┐
                        ├─> Independent (can be built in parallel)
WPB-302 (Leaderboard) ──┤
                        │
WPB-303 (User Tipping) ─┴─> WPB-304 (Venue Tipping) depends on WPB-303

WPB-305 (History) ──────> Can start after WPB-303 (shares data model)

WPB-306 (Balance Widget)─> Independent (UI enhancement)
```

---

## Sprint Planning Recommendation

### Sprint 1 (Foundation):

- WPB-301: Admin Config Page (5 pts)
- WPB-302: Leaderboard (5 pts)
- WPB-307: Contract Audit (3 pts)
- **Total: 13 pts**

### Sprint 2 (Social Features):

- WPB-303: User Tipping (8 pts)
- WPB-304: Venue Tipping (5 pts)
- WPB-308: DB Indexing (1 pt)
- **Total: 14 pts**

### Sprint 3 (Polish):

- WPB-305: Transaction History (3 pts)
- WPB-306: Balance Widget (2 pts)
- **Total: 5 pts**

---

## Definition of Done (DoD)

- [ ] Code reviewed by at least one team member
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for smart contract interactions
- [ ] Manual testing completed on testnet (Celo Alfajores)
- [ ] Documentation updated (README, API docs)
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Mobile responsive design verified
- [ ] No console errors or warnings
- [ ] Deployed to staging environment
- [ ] Product owner acceptance

---

## Risk Assessment

| Risk                          | Likelihood | Impact | Mitigation                                                             |
| ----------------------------- | ---------- | ------ | ---------------------------------------------------------------------- |
| Smart contract vulnerability  | Low        | High   | Conduct audit (WPB-307), use existing audited contracts where possible |
| Gas fees too high for tipping | Medium     | Medium | Display gas estimate before transaction, allow users to cancel         |
| Database performance issues   | Low        | Medium | Add indexes (WPB-308), implement caching, pagination                   |
| User adoption low             | Medium     | Low    | Clear UX, gamification elements, promotional campaign                  |

---

## Jira Import Format

You can copy each story section and paste into Jira, or use this CSV format:

```csv
Issue Type,Summary,Priority,Story Points,Component,Labels,Description
Epic,PXP Piano Experience Points Management System,High,,[Admin;Web3;Frontend],"pxp,gamification","Build comprehensive PXP management features including admin configuration, public leaderboard, and user tipping functionality"
Story,"As an admin, I want to configure PXP reward amounts",High,5,[Admin;Web3],"pxp,admin,configuration","[See WPB-301 description above]"
Story,"As a user, I want to view top PXP earners on a leaderboard",High,5,[Frontend;Database],"pxp,leaderboard,gamification","[See WPB-302 description above]"
Story,"As a user, I want to tip PXP to other users",Medium,8,[Frontend;Web3],"pxp,tipping,social","[See WPB-303 description above]"
Story,"As a user, I want to tip PXP to venues",Medium,5,[Frontend;Venues],"pxp,tipping,venues","[See WPB-304 description above]"
Story,"As a user, I want to view my PXP transaction history",Low,3,[Frontend;Database],"pxp,transactions,profile","[See WPB-305 description above]"
Story,"As a user, I want to see my current PXP balance in the header",Low,2,[Frontend;UX],"pxp,header,ui","[See WPB-306 description above]"
Task,PXP Smart Contract Audit,High,3,[Smart Contracts],"pxp,security,audit","[See WPB-307 description above]"
Task,Database Indexing for Leaderboard,Medium,1,[Database],"pxp,performance,database","[See WPB-308 description above]"
```
