# Sprint 2 Completion Roadmap

**Created:** December 13, 2025
**Goal:** Complete remaining Sprint 2 features
**Estimated Time:** 10-15 days total

---

## Current Status Overview

✅ **Completed:** QR System, Events, Profiles (Core), Web 2.5 Auth
🔄 **Partial:** Musician Profile Details (20%)
❌ **Not Started:** PXP Rewards Integration, Democratic Verification

**Reference:** See [SPRINT2_STATUS.md](./SPRINT2_STATUS.md) for full status details

---

## Phase 1: PXP Rewards Integration (HIGH PRIORITY)

**Goal:** Connect existing PXP contracts to user workflows
**Effort:** 3-5 days
**Value:** High - Users can earn rewards

### Tasks

#### 1.1 New User Welcome Reward

**Story:** WPB-30 - Receive reward for joining by wallet

**Implementation:**

```typescript
// In wallet connection flow (useHybridWallet.ts or similar)
async function handleFirstWalletConnection(address: string) {
  const user = await prisma.user.findUnique({ where: { walletAddress: address } })

  if (!user.hasClaimedNewUserReward) {
    // Call PXP Rewards contract
    await distributeNewUserReward(address)

    // Update database
    await prisma.user.update({
      where: { walletAddress: address },
      data: { hasClaimedNewUserReward: true },
    })

    // Show notification
    showRewardNotification('Welcome! You earned 100 PXP!')
  }
}
```

**Files to modify:**

- `hooks/useHybridWallet.ts` - Add reward check after connection
- `utils/rewards-contract.ts` - Add `distributeNewUserReward()` function
- `app/api/rewards/claim-welcome/route.ts` - API endpoint for claiming

**Acceptance Criteria:**

- [ ] New users auto-receive 100 PXP on first wallet connection
- [ ] Database flag prevents double-claiming
- [ ] Notification shows reward earned
- [ ] Reward visible in user profile PXP balance

---

#### 1.2 Scout Reward for Verified Venues

**Story:** WPB-34 - Scout receives reward when venue verified

**Implementation:**

```typescript
// In curator verification flow (app/curator/page.tsx)
async function handleVerifyVenue(venueId: number, approved: boolean) {
  if (approved) {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: { submittedByUser: true },
    })

    // Distribute scout reward
    if (venue.submittedByUser.walletAddress) {
      await distributeScoutReward(venue.submittedByUser.walletAddress, venueId)

      // Create notification
      await prisma.notification.create({
        data: {
          userId: venue.submittedByUser.id,
          type: 'REWARD_EARNED',
          message: `You earned 50 PXP for your ${venue.name} submission!`,
        },
      })
    }

    // Mark venue verified
    await prisma.venue.update({
      where: { id: venueId },
      data: { verified: true },
    })
  }
}
```

**Files to modify:**

- `app/curator/page.tsx` - Add reward trigger in `handleVerifyVenue()`
- `utils/rewards-contract.ts` - Add `distributeScoutReward()` function
- `prisma/schema.prisma` - Add Notification model (if not exists)

**Acceptance Criteria:**

- [ ] Scout receives 50 PXP when their venue gets verified
- [ ] Notification appears in user's profile/notification center
- [ ] Reward added to totalCAVEarned in user record
- [ ] Works for both wallet and email users (skip if no wallet)

---

#### 1.3 Pending Rewards Notification UI

**Story:** Display pending reward notifications

**Implementation:**

```typescript
// In profile or header component
function PendingRewardsNotification() {
  const { pendingRewards } = usePendingRewards() // Hook to fetch from API

  if (!pendingRewards || pendingRewards.length === 0) return null

  return (
    <div className="bg-blue-50 border-blue-200 p-4 rounded-lg">
      <h3>🎁 Pending Rewards</h3>
      <ul>
        {pendingRewards.map(reward => (
          <li key={reward.id}>
            {reward.amount} PXP - {reward.reason}
            <button onClick={() => claimReward(reward.id)}>Claim</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Files to create:**

- `components/rewards/PendingRewardsNotification.tsx`
- `hooks/usePendingRewards.ts`
- `app/api/rewards/pending/route.ts`

**Files to modify:**

- `app/profile/[address]/page.tsx` - Add notification component

**Acceptance Criteria:**

- [ ] Notification badge shows number of pending rewards
- [ ] Clicking notification shows reward details
- [ ] User can claim rewards with one click
- [ ] Claimed rewards update PXP balance immediately

---

## Phase 2: Musician Profile Details (MEDIUM PRIORITY)

**Goal:** Add musician-specific fields to profiles
**Effort:** 2-3 days
**Value:** Medium - Better musician discovery

### Tasks

#### 2.1 Database Schema Updates

**Prisma schema additions:**

```prisma
model User {
  // ... existing fields ...

  // Musician-specific fields
  instruments        String[]     // e.g., ["Piano", "Guitar", "Vocals"]
  genres            String[]     // e.g., ["Jazz", "Classical", "Blues"]
  experienceLevel   String?      // "Beginner", "Intermediate", "Advanced", "Professional"
  availability      String?      // "Available", "Limited", "Not Available"
  performanceLinks  Json?        // { youtube: "...", soundcloud: "..." }
  repertoire        String?      // Free text: known songs, pieces
}
```

**Migration:**

```bash
npx prisma migrate dev --name add_musician_profile_fields
```

**Files to modify:**

- `prisma/schema.prisma`

**Acceptance Criteria:**

- [ ] Migration creates new fields without data loss
- [ ] Existing users can log in normally
- [ ] New fields default to null/empty

---

#### 2.2 Profile Edit Form Enhancement

**Add fields to edit form:**

**Files to modify:**

- `app/profile/[address]/edit/page.tsx`

**New form sections:**

```typescript
// Instruments multi-select
<MultiSelect
  label="Instruments"
  options={["Piano", "Guitar", "Drums", "Bass", "Vocals", "Saxophone", "Violin", "Other"]}
  value={formData.instruments}
  onChange={(value) => setFormData({ ...formData, instruments: value })}
/>

// Genres multi-select
<MultiSelect
  label="Musical Genres"
  options={["Jazz", "Classical", "Rock", "Blues", "Pop", "Folk", "Electronic", "Other"]}
  value={formData.genres}
  onChange={(value) => setFormData({ ...formData, genres: value })}
/>

// Experience level dropdown
<Select
  label="Experience Level"
  options={[
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "professional", label: "Professional" }
  ]}
  value={formData.experienceLevel}
  onChange={(value) => setFormData({ ...formData, experienceLevel: value })}
/>

// Availability toggle
<RadioGroup
  label="Availability for Gigs/Collaborations"
  options={[
    { value: "available", label: "Available" },
    { value: "limited", label: "Limited Availability" },
    { value: "not_available", label: "Not Available" }
  ]}
  value={formData.availability}
  onChange={(value) => setFormData({ ...formData, availability: value })}
/>

// Performance links
<div>
  <label>Performance Links</label>
  <input
    type="url"
    placeholder="YouTube Channel"
    value={formData.performanceLinks?.youtube}
    onChange={(e) => setFormData({
      ...formData,
      performanceLinks: { ...formData.performanceLinks, youtube: e.target.value }
    })}
  />
  <input
    type="url"
    placeholder="SoundCloud Profile"
    value={formData.performanceLinks?.soundcloud}
    onChange={...}
  />
</div>

// Repertoire
<textarea
  label="Repertoire / Known Songs"
  placeholder="List songs, pieces, or styles you can perform..."
  value={formData.repertoire}
  onChange={(e) => setFormData({ ...formData, repertoire: e.target.value })}
  rows={4}
/>
```

**Acceptance Criteria:**

- [ ] All new fields appear in edit form
- [ ] Multi-selects allow multiple choices
- [ ] Form validation works
- [ ] Save updates database correctly

---

#### 2.3 Profile Display Enhancement

**Display new fields on profile page:**

**Files to modify:**

- `app/profile/[address]/page.tsx`

**Display sections:**

```typescript
{/* Instruments */}
{user.instruments?.length > 0 && (
  <div className="flex gap-2">
    <strong>Instruments:</strong>
    {user.instruments.map(instrument => (
      <span key={instrument} className="badge">{instrument}</span>
    ))}
  </div>
)}

{/* Genres */}
{user.genres?.length > 0 && (
  <div className="flex gap-2">
    <strong>Genres:</strong>
    {user.genres.map(genre => (
      <span key={genre} className="badge">{genre}</span>
    ))}
  </div>
)}

{/* Experience */}
{user.experienceLevel && (
  <div>
    <strong>Experience:</strong> {user.experienceLevel}
  </div>
)}

{/* Availability */}
{user.availability && (
  <div className={getAvailabilityColor(user.availability)}>
    🎵 {user.availability === 'available' ? 'Available for gigs' : 'Limited availability'}
  </div>
)}

{/* Performance Links */}
{user.performanceLinks && (
  <div>
    <strong>Listen:</strong>
    {user.performanceLinks.youtube && <a href={user.performanceLinks.youtube}>YouTube</a>}
    {user.performanceLinks.soundcloud && <a href={user.performanceLinks.soundcloud}>SoundCloud</a>}
  </div>
)}

{/* Repertoire */}
{user.repertoire && (
  <div>
    <strong>Repertoire:</strong>
    <p className="whitespace-pre-wrap">{user.repertoire}</p>
  </div>
)}
```

**Acceptance Criteria:**

- [ ] All musician fields display on profile
- [ ] Empty fields don't show
- [ ] Links are clickable and open in new tab
- [ ] Styling matches existing profile design

---

## Phase 3: Democratic Verification (OPTIONAL / FUTURE)

**Goal:** Multi-verifier consensus for venue approval
**Effort:** 5-7 days
**Value:** Low (current blog owner verification works well)

**Recommendation:** **DEFER to Sprint 3 or later**

### Why Defer?

1. **Current system works:** Blog owner verification is functioning
2. **Low ROI:** Not many verifiers exist yet to make consensus meaningful
3. **Complexity:** Requires significant smart contract or workflow changes
4. **Better priorities:** Focus on PXP rewards and profile features first

### If Implementing (Future):

**Design decisions needed:**

- On-chain voting (expensive) vs off-chain consensus (centralized)?
- How many verifiers needed? (3 minimum? 5?)
- What happens if votes tie?
- Time limit for voting?
- Verifier reputation/scoring system?

**Files to create:**

- `app/admin/verifiers/page.tsx` - Manage authorized verifiers
- `components/verification/MultiVerifierVote.tsx` - Voting UI
- `app/api/venues/[id]/vote/route.ts` - Record verifier votes

---

## Implementation Priority Order

**Recommended sequence:**

### Week 1 (Days 1-5): PXP Rewards

- Day 1-2: New user welcome reward (1.1)
- Day 3-4: Scout reward for verified venues (1.2)
- Day 5: Pending rewards notification UI (1.3)

### Week 2 (Days 6-8): Musician Profiles

- Day 6: Database schema + migration (2.1)
- Day 7: Profile edit form updates (2.2)
- Day 8: Profile display enhancements (2.3)

### Testing & Polish (Days 9-10):

- Day 9: End-to-end testing of rewards flow
- Day 10: Bug fixes, documentation, deployment

**Democratic Verification:** Deferred to future sprint

---

## Success Metrics

After completion, Sprint 2 will be considered **100% complete** if:

- ✅ New users receive automatic welcome reward
- ✅ Scouts receive reward when venue verified
- ✅ Users see pending reward notifications
- ✅ Musician profiles show instruments, genres, experience
- ✅ Profile search/filter works with new fields
- ✅ All features tested on Vercel production

---

## Dependencies & Blockers

**No blockers identified!**

- ✅ PXP contracts already deployed (Sepolia)
- ✅ Database schema supports JSON fields
- ✅ Profile infrastructure exists
- ✅ Reward contract utilities exist (`utils/rewards-contract.ts`)

**External dependencies:**

- Celo Sepolia testnet must be stable (no downtime)
- Vercel deployment pipeline working

---

## Next Steps

1. **Review this roadmap** - Confirm priorities
2. **Choose Phase 1 or Phase 2** to start with
3. **Create feature branch** - `git checkout -b feature/sprint2-completion`
4. **Start implementation** - Follow tasks in order
5. **Test thoroughly** - Each phase before moving to next
6. **Deploy to production** - After all phases complete

**Questions?** Review [SPRINT2_STATUS.md](./SPRINT2_STATUS.md) for current state details.
