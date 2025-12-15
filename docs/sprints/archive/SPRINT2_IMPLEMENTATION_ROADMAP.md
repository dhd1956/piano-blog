# Sprint 2 Implementation Roadmap

**Piano Blog Project - October 11 - November 8, 2025**

---

## Quick Reference

- **Total Stories:** 13
- **Duration:** 4 weeks
- **Current Status:** In Progress
- **Primary Focus:** Musician Profiles (54%), QR Codes (23%), PXP Rewards (23%)

---

## Week 1: Foundation & Infrastructure (Oct 11-17)

### Goals

- Set up database schema for musician profiles
- Enhance QR scanner for new formats
- Create base profile pages

### Stories to Complete

#### 🏗️ WPB-140: Replace 'Projects' with 'My Profile' [HIGH PRIORITY]

**Estimated Effort:** 8 hours

**Tasks:**

1. Update `/data/headerNavLinks.ts` navigation
   ```typescript
   { href: '/profile', title: 'My Profile' },  // Replace Projects
   ```
2. Create `/app/profile/page.tsx` - Base profile page
3. Create `/app/profile/[address]/page.tsx` - View other profiles
4. Link profile to wallet address from useHybridWallet hook
5. Test navigation and routing

**Files to Create:**

- `/app/profile/page.tsx`
- `/app/profile/[address]/page.tsx`

**Files to Modify:**

- `/data/headerNavLinks.ts`

**Acceptance Criteria:**

- [x] "My Profile" appears in navigation menu
- [x] Clicking "My Profile" shows user's own profile
- [x] Profile URL: `/profile` (own) or `/profile/[address]` (others)
- [x] Projects functionality remains intact (do not delete)

---

#### 🔍 WPB-88: Enhance PXP QR Scanner [HIGH PRIORITY]

**Estimated Effort:** 12 hours

**Tasks:**

1. Open `/components/payments/PXPQRScanner.tsx`
2. Add QR format parsing logic:
   ```typescript
   const parseQRData = (data: string) => {
     if (data.startsWith('pianoblog://venue/')) {
       return { type: 'venue', slug: data.split('/').pop() }
     }
     if (data.startsWith('pianoblog://profile/')) {
       return { type: 'profile', identifier: data.split('/').pop() }
     }
     if (data.startsWith('celo://')) {
       return { type: 'payment', ...parsePaymentURI(data) }
     }
     return { type: 'unknown' }
   }
   ```
3. Add routing logic using Next.js router
4. Create payment modal component for payment QR codes
5. Add error handling for invalid QR formats
6. Test all three QR types

**Files to Modify:**

- `/components/payments/PXPQRScanner.tsx`

**Files to Create:**

- `/components/payments/PaymentModal.tsx` (for payment QR codes)

**Acceptance Criteria:**

- [x] Venue QR → Routes to `/venues/[slug]`
- [x] Profile QR → Routes to `/profile/[address]`
- [x] Payment QR → Opens payment modal with amount and recipient
- [x] Invalid QR → Shows error message
- [x] All QR types tested and working

---

#### 💾 Database Schema Setup

**Estimated Effort:** 4 hours

**Tasks:**

1. Update `/prisma/schema.prisma` with MusicianProfile model:

   ```prisma
   model MusicianProfile {
     id                  Int      @id @default(autoincrement())
     walletAddress       String   @unique
     instruments         String[]
     musicalStyles       String[]
     genres              String[]
     experienceLevel     String?
     yearsPlaying        Int?
     availableForGigs    Boolean  @default(false)
     availableForCollab  Boolean  @default(false)
     availabilityNotes   String?  @db.Text
     recordingLinks      String[]
     socialMedia         Json?
     repertoire          String[]
     createdAt           DateTime @default(now())
     updatedAt           DateTime @updatedAt
   }
   ```

2. Add Venue QR fields:

   ```prisma
   model Venue {
     // ... existing fields
     qrCodeGenerated     Boolean  @default(false)
     qrCardStyle         String?
   }
   ```

3. Run migration:
   ```bash
   npx prisma migrate dev --name add_musician_profiles_and_qr
   npx prisma generate
   ```

**Files to Modify:**

- `/prisma/schema.prisma`

**Acceptance Criteria:**

- [x] Migration runs successfully
- [x] MusicianProfile table created in database
- [x] Venue table updated with QR fields
- [x] Prisma client regenerated

---

### Week 1 Testing Checklist

- [ ] Navigation shows "My Profile" menu item
- [ ] Own profile page loads without errors
- [ ] Other user profiles viewable via URL
- [ ] QR scanner routes to venue pages correctly
- [ ] QR scanner routes to profile pages correctly
- [ ] QR scanner shows payment modal for payment codes
- [ ] Database migrations applied successfully

---

## Week 2: Profile Features & QR Generation (Oct 18-24)

### Goals

- Implement core profile fields (instruments, styles, experience)
- Add QR generation to venue pages
- Create profile edit forms

### Stories to Complete

#### 🎹 WPB-109: Instrument Profile

**Estimated Effort:** 6 hours

**Tasks:**

1. Create `/components/profile/InstrumentSelector.tsx`
2. Add multi-select dropdown for instruments
3. Common instruments: Piano, Guitar, Drums, Bass, Violin, Saxophone, etc.
4. Allow custom instrument entry
5. Save to MusicianProfile.instruments array

**Files to Create:**

- `/components/profile/InstrumentSelector.tsx`

**API Endpoint:**

- `PUT /api/profile/[address]` - Update profile instruments

**Acceptance Criteria:**

- [x] User can select multiple instruments
- [x] User can add custom instruments
- [x] Instruments saved to database
- [x] Instruments displayed on profile view

---

#### 🎵 WPB-110: Musical Style & Genre

**Estimated Effort:** 6 hours

**Tasks:**

1. Create `/components/profile/StyleGenreSelector.tsx`
2. Multi-select for styles: Jazz, Classical, Blues, Rock, Pop, etc.
3. Multi-select for genres (sub-categories)
4. Save to MusicianProfile.musicalStyles and genres arrays

**Files to Create:**

- `/components/profile/StyleGenreSelector.tsx`

**Acceptance Criteria:**

- [x] User can select multiple styles
- [x] User can select multiple genres
- [x] Selections saved to database
- [x] Displayed on profile view

---

#### 📊 WPB-111: Experience Level

**Estimated Effort:** 4 hours

**Tasks:**

1. Create `/components/profile/ExperienceLevelSelector.tsx`
2. Radio buttons: Beginner, Intermediate, Advanced, Professional
3. Optional number input for years playing
4. Save to MusicianProfile.experienceLevel and yearsPlaying

**Files to Create:**

- `/components/profile/ExperienceLevelSelector.tsx`

**Acceptance Criteria:**

- [x] User can select one experience level
- [x] User can optionally enter years playing
- [x] Data saved to database
- [x] Displayed on profile view

---

#### 📱 WPB-90: Add QR Generation to Venue Pages

**Estimated Effort:** 10 hours

**Tasks:**

1. Open `/app/venues/[slug]/page.tsx`
2. Add "Generate QR Code" button (only for venue submitter, verifiers, blog owner)
3. Create `/components/qr/VenueQRCard.tsx` modal component
4. Generate QR code with format: `pianoblog://venue/{slug}`
5. Save QR config to database via API
6. API endpoint: `PUT /api/venues/[venueId]/qr-config`

**Files to Modify:**

- `/app/venues/[slug]/page.tsx`

**Files to Create:**

- `/components/qr/VenueQRCard.tsx`
- `/app/api/venues/[venueId]/qr-config/route.ts`

**Dependencies:**

```bash
yarn add qrcode
yarn add @types/qrcode --dev
```

**Acceptance Criteria:**

- [x] "Generate QR Code" button visible to authorized users
- [x] Button hidden for non-authorized users
- [x] QR modal displays venue QR code
- [x] QR config saved to database
- [x] QR code scannable and routes to venue page

---

### Week 2 Testing Checklist

- [ ] Instrument selector saves correctly
- [ ] Style/genre selector saves correctly
- [ ] Experience level saves correctly
- [ ] QR button only visible to authorized users
- [ ] QR code generates correctly
- [ ] Scanning QR code routes to correct venue page
- [ ] QR config persists in database

---

## Week 3: PXP Rewards & Advanced Profile (Oct 25-31)

### Goals

- Implement PXP welcome rewards
- Add pending reward notifications
- Complete remaining profile fields

### Stories to Complete

#### 💰 WPB-30: Welcome Reward for Joining by Wallet [HIGH PRIORITY]

**Estimated Effort:** 12 hours

**Tasks:**

1. Create Transaction model in Prisma schema:

   ```prisma
   model Transaction {
     id            Int      @id @default(autoincrement())
     walletAddress String
     amount        Decimal  @db.Decimal(10, 2)
     type          String   // "WELCOME_REWARD", "VERIFIER_REWARD", "SCOUT_REWARD"
     relatedId     Int?
     txHash        String?
     status        String   @default("PENDING")
     createdAt     DateTime @default(now())
   }
   ```

2. Run migration:

   ```bash
   npx prisma migrate dev --name add_transactions
   ```

3. Create `/lib/celo/rewardService.ts`:

   ```typescript
   export async function awardWelcomeBonus(walletAddress: string) {
     // Check if user already received welcome bonus
     // Award PXP via Celo transaction
     // Record in PostgreSQL Transaction table
   }
   ```

4. Update wallet connection logic in `/hooks/useHybridWallet.ts`
5. Create API endpoint: `POST /api/rewards/welcome`
6. Show success notification when welcome PXP awarded

**Files to Create:**

- `/lib/celo/rewardService.ts`
- `/app/api/rewards/welcome/route.ts`

**Files to Modify:**

- `/prisma/schema.prisma`
- `/hooks/useHybridWallet.ts`

**Acceptance Criteria:**

- [x] New wallet connection triggers welcome reward check
- [x] Welcome PXP awarded only once per wallet
- [x] Transaction recorded in PostgreSQL
- [x] Transaction hash recorded from Celo blockchain
- [x] Success notification shown to user
- [x] User can see welcome PXP in their balance

---

#### 🔔 WPB-34: Display Pending Reward Notification

**Estimated Effort:** 8 hours

**Tasks:**

1. Create `/components/rewards/PendingRewardNotification.tsx`
2. Query PostgreSQL for user's pending venues:
   ```sql
   SELECT * FROM Venue
   WHERE submittedBy = ? AND verified = false AND rejectedAt IS NULL
   ```
3. Calculate pending PXP: 50 PXP per pending venue
4. Display notification in dashboard/profile
5. Create API endpoint: `GET /api/rewards/pending`

**Files to Create:**

- `/components/rewards/PendingRewardNotification.tsx`
- `/app/api/rewards/pending/route.ts`

**Acceptance Criteria:**

- [x] Notification shows count of pending venues
- [x] Shows total pending PXP amount
- [x] Lists pending venues with submission dates
- [x] Updates when venues are verified
- [x] Shows earned PXP when venues approved

---

#### 📅 WPB-112: Availability & Collaboration

**Estimated Effort:** 6 hours

**Tasks:**

1. Create `/components/profile/AvailabilitySelector.tsx`
2. Checkboxes: Available for gigs, Available for collaborations
3. Text area for availability notes
4. Save to MusicianProfile table

**Files to Create:**

- `/components/profile/AvailabilitySelector.tsx`

**Acceptance Criteria:**

- [x] User can toggle gig availability
- [x] User can toggle collaboration availability
- [x] User can add availability notes
- [x] Data saved to database
- [x] Displayed on profile view

---

#### 🎬 WPB-113: Performance Portfolio

**Estimated Effort:** 6 hours

**Tasks:**

1. Create `/components/profile/PerformanceLinks.tsx`
2. Input fields for recording links (YouTube, SoundCloud, etc.)
3. Social media links (Instagram, Facebook, TikTok, etc.)
4. Save to MusicianProfile.recordingLinks and socialMedia

**Files to Create:**

- `/components/profile/PerformanceLinks.tsx`

**Acceptance Criteria:**

- [x] User can add multiple recording links
- [x] User can add social media links
- [x] Links validated (proper URL format)
- [x] Data saved to database
- [x] Clickable links on profile view

---

### Week 3 Testing Checklist

- [ ] Welcome PXP awarded on first wallet connection
- [ ] Welcome transaction recorded in database and blockchain
- [ ] Pending reward notification shows correct count
- [ ] Pending reward notification shows correct PXP amount
- [ ] Availability checkboxes work correctly
- [ ] Performance links save and display correctly
- [ ] Social media links validated

---

## Week 4: Democratic Verification & Polish (Nov 1-8)

### Goals

- Implement multi-verifier consensus system
- Complete final profile field
- Add print-ready QR templates
- Final testing and bug fixes

### Stories to Complete

#### 🏛️ WPB-3: Democratic Venue Verification [HIGH PRIORITY]

**Estimated Effort:** 16 hours

**Tasks:**

1. Create VenueVerification model:

   ```prisma
   model VenueVerification {
     id              Int      @id @default(autoincrement())
     venueId         Int
     verifierAddress String
     approved        Boolean
     verifiedAt      DateTime @default(now())
     pxpAwarded      Boolean  @default(false)
     txHash          String?
     venue           Venue    @relation(fields: [venueId], references: [id])
     @@unique([venueId, verifierAddress])
   }
   ```

2. Run migration:

   ```bash
   npx prisma migrate dev --name add_venue_verification
   ```

3. Create `/app/api/venues/[venueId]/verify/route.ts`:
   - Accept verifier vote (approve/reject)
   - Track all verifications
   - When 3rd approval received:
     - Set venue.verified = true
     - Award 25 PXP to each verifier (3 transactions)
     - Award 50 PXP to original scout (1 transaction)
     - Record all transactions in PostgreSQL and Celo

4. Update curator page to use new verification system
5. Create verifier dashboard showing venues to review

**Files to Create:**

- `/app/api/venues/[venueId]/verify/route.ts`
- `/app/api/venues/[venueId]/verifications/route.ts` (GET)
- `/components/verification/VerifierDashboard.tsx`

**Files to Modify:**

- `/prisma/schema.prisma`
- `/app/curator/page.tsx`

**Acceptance Criteria:**

- [x] Multiple verifiers can vote on same venue
- [x] Each verifier can only vote once per venue
- [x] Venue becomes verified after 3 approvals
- [x] All 3 verifiers receive 25 PXP each
- [x] Scout receives 50 PXP
- [x] All transactions recorded in PostgreSQL
- [x] All transactions on Celo blockchain
- [x] Rejected votes tracked separately

---

#### 🎼 WPB-114: Repertoire & Known Songs

**Estimated Effort:** 6 hours

**Tasks:**

1. Create `/components/profile/RepertoireList.tsx`
2. Tag input for adding songs/pieces
3. Autocomplete for common jazz standards
4. Save to MusicianProfile.repertoire array

**Files to Create:**

- `/components/profile/RepertoireList.tsx`

**Acceptance Criteria:**

- [x] User can add multiple songs
- [x] User can remove songs
- [x] Autocomplete suggests common songs
- [x] Data saved to database
- [x] Displayed on profile view

---

#### 🖨️ WPB-91: Print-Ready Templates Component

**Estimated Effort:** 12 hours

**Tasks:**

1. Install dependencies:

   ```bash
   yarn add html2canvas jspdf jszip
   ```

2. Create `/components/qr/PrintTemplates.tsx`:
   - CSS print media queries (3.5" x 2" business card)
   - Bleed marks and crop marks
   - 300 DPI minimum resolution
   - Export as PNG
   - Export as PDF (RGB/CMYK support)
   - Batch export as ZIP

3. Add export buttons to VenueQRCard modal

**Files to Create:**

- `/components/qr/PrintTemplates.tsx`
- `/lib/qr/exportUtils.ts`

**Files to Modify:**

- `/components/qr/VenueQRCard.tsx`

**Acceptance Criteria:**

- [x] QR code exports as 300 DPI PNG
- [x] QR code exports as PDF
- [x] Print template includes bleed and crop marks
- [x] Business card size: 3.5" x 2"
- [x] Batch export creates ZIP file
- [x] Exports tested with professional printing service

---

### Week 4 Testing Checklist

- [ ] Multi-verifier system works correctly
- [ ] 3 approvals triggers verification and PXP distribution
- [ ] Verifiers receive 25 PXP each
- [ ] Scout receives 50 PXP
- [ ] All transactions on blockchain
- [ ] Repertoire list saves correctly
- [ ] Print templates export correctly
- [ ] 300 DPI PNG export verified
- [ ] PDF export verified
- [ ] Batch ZIP export verified

---

## Sprint 2 Completion Checklist

### Musician Profiles (7 stories)

- [ ] WPB-140: My Profile menu item
- [ ] WPB-109: Instrument profile
- [ ] WPB-110: Musical styles & genres
- [ ] WPB-111: Experience level
- [ ] WPB-112: Availability & collaboration
- [ ] WPB-113: Performance portfolio
- [ ] WPB-114: Repertoire & known songs

### QR Code System (3 stories)

- [ ] WPB-88: Enhanced PXP QR scanner
- [ ] WPB-90: QR generation on venue pages
- [ ] WPB-91: Print-ready templates

### PXP Rewards (3 stories)

- [ ] WPB-30: Welcome reward for new wallets
- [ ] WPB-34: Pending reward notification
- [ ] WPB-3: Democratic verification & rewards

### Technical Checklist

- [ ] All database migrations applied
- [ ] All dependencies installed (qrcode, html2canvas, jspdf, jszip)
- [ ] All API endpoints tested with Postman
- [ ] PXP transactions tested on Celo testnet
- [ ] All transactions recorded in PostgreSQL
- [ ] All UI components responsive on mobile
- [ ] No console errors
- [ ] All code committed to git

---

## Risk Mitigation

### Risk 1: Celo Blockchain Integration Delays

**Impact:** HIGH
**Probability:** MEDIUM
**Mitigation:**

- Start with welcome rewards (simpler flow)
- Test Celo transactions early in Week 3
- Have fallback: Record in PostgreSQL first, sync to blockchain async
- Create transaction retry mechanism for failed blockchain writes

### Risk 2: QR Print Quality Issues

**Impact:** MEDIUM
**Probability:** LOW
**Mitigation:**

- Test 300 DPI exports early (Week 2)
- Get stakeholder approval on print quality
- Test with actual printing service if possible
- Have web-based QR fallback

### Risk 3: Profile System Scope Creep

**Impact:** MEDIUM
**Probability:** MEDIUM
**Mitigation:**

- Stick to planned 7 profile fields only
- Defer additional features to Sprint 3
- Implement in phases (Week 2 & Week 4)
- Mark WPB-112, 113, 114 as "nice to have" if time runs short

---

## Daily Standup Questions

**Every morning:**

1. What did I complete yesterday?
2. What am I working on today?
3. Are there any blockers?
4. Are PXP transactions working on Celo testnet?
5. Are database migrations up to date?

---

## Definition of Done

A story is **DONE** when:

- [x] Code implemented and working locally
- [x] Database migrations run successfully
- [x] API endpoints tested with Postman (if applicable)
- [x] PXP transactions tested on Celo testnet (if applicable)
- [x] Transactions logged in PostgreSQL (if applicable)
- [x] UI responsive on mobile and desktop
- [x] No console errors
- [x] Code committed with descriptive message
- [x] All acceptance criteria met
- [x] Tested by someone other than developer (if possible)

---

## Success Metrics

By end of Sprint 2, we should have:

- [ ] **7 profile fields** fully functional
- [ ] **5+ test profiles** created with complete data
- [ ] **10+ venues** with QR codes generated
- [ ] **QR scanner** routing to venue/profile/payment correctly
- [ ] **3+ welcome rewards** successfully distributed on Celo
- [ ] **Democratic verification** tested with 3+ verifiers
- [ ] **All PXP transactions** recorded on Celo blockchain
- [ ] **All transactions** logged in PostgreSQL
- [ ] **Print templates** generating 300 DPI exports

---

## Final Sprint Review Agenda

**Nov 8, 2025 - Sprint 2 Review Meeting**

1. **Demo Musician Profiles** (10 min)
   - Show complete profile with all 7 fields
   - Navigate to other users' profiles
   - Show profile discovery workflow

2. **Demo QR Code System** (10 min)
   - Generate QR for venue
   - Scan venue QR → Routes to page
   - Scan profile QR → Routes to profile
   - Export print-ready template

3. **Demo PXP Rewards** (10 min)
   - Connect new wallet → Receive welcome PXP
   - Show pending reward notification
   - Demo democratic verification (3 verifiers)
   - Show PXP distribution to verifiers and scout

4. **Review Metrics** (5 min)
   - How many profiles created?
   - How many QR codes generated?
   - How many PXP transactions completed?

5. **Sprint Retrospective** (10 min)
   - What went well?
   - What could be improved?
   - Action items for Sprint 3

---

**Last Updated:** 2025-10-29
**Document Version:** 1.0
