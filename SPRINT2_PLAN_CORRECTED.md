# Sprint 2 Plan - Piano Blog Project

**Sprint Duration:** October 11, 2025 - November 8, 2025
**Total Stories:** 13 user stories across 5 Epics
**Status:** In Progress

---

## Technology Stack (Corrected)

- **Database:** PostgreSQL (Neon) - All data storage
- **Blockchain:** Celo Alfajores testnet - PXP token ledger only
- **Token:** PXP (Piano Experience Points) - Already minted on Celo testnet
- **Frontend:** Next.js 15.2.4 with App Router
- **NOT in Sprint 2:** IPFS (reserved for future sprints - audio file storage with timestamps)

---

## Epic 1: Musician Profiles (7 stories - 54% of sprint)

**Goal:** Replace unused "Projects" menu with comprehensive musician marketing profiles

### WPB-140: Replace 'Projects' Menu with 'My Profile'

- **Status:** To Do
- **Priority:** HIGH (Foundation for other profile stories)
- **User Story:** As a user, I want to have my own profile so that I may market myself in the community.
- **Technical Details:**
  - Update navigation menu in `data/headerNavLinks.ts`
  - Create new route: `/app/profile/page.tsx`
  - DO NOT delete existing Projects functionality from TailWinds blog
  - Link profile to wallet address or user ID

### WPB-109: Instrument Profile

- **Status:** To Do
- **User Story:** As a musician, I want to list the instruments I play so that other musicians and event hosts know my capabilities.
- **Database Schema:**
  ```prisma
  model MusicianProfile {
    instruments String[] // Array of instrument names
  }
  ```

### WPB-110: Musical Style & Genre

- **Status:** To Do
- **User Story:** As a musician, I want to specify my musical styles and genres so that I can connect with musicians who play similar music.
- **Database Schema:**
  ```prisma
  model MusicianProfile {
    musicalStyles String[] // e.g., ["Jazz", "Classical", "Blues"]
    genres        String[] // Sub-genres
  }
  ```

### WPB-111: Experience Level

- **Status:** To Do
- **User Story:** As a musician, I want to indicate my experience level so that event hosts know if I'm suitable for their events.
- **Database Schema:**
  ```prisma
  model MusicianProfile {
    experienceLevel String // "Beginner", "Intermediate", "Advanced", "Professional"
    yearsPlaying    Int?
  }
  ```

### WPB-112: Availability & Collaboration

- **Status:** To Do
- **User Story:** As a musician, I want to indicate my availability for gigs and collaborations so that opportunities can find me.
- **Database Schema:**
  ```prisma
  model MusicianProfile {
    availableForGigs    Boolean @default(false)
    availableForCollab  Boolean @default(false)
    availabilityNotes   String? @db.Text
  }
  ```

### WPB-113: Performance Portfolio

- **Status:** To Do
- **User Story:** As a musician, I want to link my performance recordings and social media so that people can hear my playing.
- **Database Schema:**
  ```prisma
  model MusicianProfile {
    recordingLinks  String[] // YouTube, SoundCloud, etc.
    socialMedia     Json?    // {youtube: "", instagram: "", etc.}
  }
  ```

### WPB-114: Repertoire & Known Songs

- **Status:** To Do
- **User Story:** As a musician, I want to list songs/pieces I know so that jam session hosts know what I can play.
- **Database Schema:**
  ```prisma
  model MusicianProfile {
    repertoire String[] // List of songs/pieces
  }
  ```

---

## Epic 2: QR Code Profile System (3 stories - 23% of sprint)

**Goal:** Professional print-ready QR codes for venues and user profiles

### WPB-88: Enhance PXP QR Scanner for New Formats

- **Status:** ready for ist
- **Priority:** HIGH (Foundation for other QR stories)
- **File:** `/components/payments/PXPQRScanner.tsx`
- **User Story:** As a user, I want to scan QR codes and be taken to the right place so that I can view venue details, user profiles, or make payments seamlessly.
- **Technical Requirements:**
  - Extend existing PXPQRScanner component
  - Parse three QR code types:
    1. **Venue QR:** `pianoblog://venue/{slug}` → Route to `/venues/{slug}`
    2. **Profile QR:** `pianoblog://profile/{slug}` or `pianoblog://profile/{walletAddress}`
    3. **Payment QR:** Celo payment URI with PXP amount
  - Handle deep links and routing
  - Optional payment modals for payment QR codes
  - Error handling for invalid QR formats

### WPB-90: Add QR Generation to Venue Pages

- **Status:** ready for ist
- **File:** `/app/venues/[slug]/page.tsx`
- **User Story:** As a venue owner, I want a button on my venue page to generate QR codes so that I can easily create marketing materials for my venue.
- **Technical Requirements:**
  - Add "Generate QR Code" button to venue detail pages
  - Permissions: Only venue submitter, authorized verifiers, or blog owner
  - Show VenueQRCard component in modal
  - Save QR configuration to PostgreSQL
  - Database fields:
    ```prisma
    model Venue {
      qrCodeGenerated Boolean @default(false)
      qrCardStyle     String? // Style preference for QR card
    }
    ```
  - API endpoint: `PUT /api/venues/{venueId}/qr-config`

### WPB-91: Create Print-Ready Templates Component

- **Status:** ready for ist
- **Priority:** MEDIUM
- **File:** `/components/qr/PrintTemplates.tsx` (NEW)
- **User Story:** As a venue owner, I want print-ready QR codes with industry standards so that I can get professional printing without quality issues.
- **Technical Requirements:**
  - CSS print media queries with proper dimensions
  - Bleed marks and crop marks for professional printing
  - Export utilities:
    - High-DPI PNG export (300 DPI minimum)
    - PDF generation with RGB/CMYK color space support
    - Batch export as ZIP file
  - Standard sizes: 3.5" x 2" business card format
  - Dependencies to install:
    ```json
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "jszip": "^3.10.1"
    ```
  - Component structure:
    ```tsx
    <PrintTemplates
      qrData={venueUrl}
      venueName={venue.name}
      style="business-card" // or "flyer", "poster"
      onExport={(format) => handleExport(format)}
    />
    ```

---

## Epic 3: User Onboarding and Identity Management (1 story)

### WPB-30: Receive Reward for Joining by Wallet

- **Status:** ready for ist
- **Priority:** HIGH
- **User Story:** As a new user, I want to receive a starting amount of PXP immediately after connecting my wallet so that I feel welcomed and can start participating.
- **PXP Reward:** Welcome bonus (amount TBD, e.g., 10 PXP)
- **Technical Requirements:**
  - Detect first-time wallet connection
  - Check if wallet address exists in database
  - If new: Award welcome PXP via Celo transaction
  - Record transaction in PostgreSQL:
    ```prisma
    model Transaction {
      id            Int      @id @default(autoincrement())
      walletAddress String
      amount        Decimal  @db.Decimal(10, 2)
      type          String   // "WELCOME_REWARD"
      txHash        String?  // Celo transaction hash
      createdAt     DateTime @default(now())
    }
    ```
  - Show success message: "Welcome! You've received [X] PXP to get started!"

---

## Epic 4: Venues Discovery & Content Management (1 story)

### WPB-34: Display Pending Reward Notification

- **Status:** ready for ist
- **Priority:** MEDIUM
- **User Story:** As a venue scout, I want a pending reward notification so that I know my submission is being reviewed.
- **PXP Related:** Display pending PXP amount and list of venues submitted by scout
- **Technical Requirements:**
  - Add notification component to dashboard/profile
  - Query PostgreSQL for user's pending venues:
    ```sql
    SELECT * FROM Venue
    WHERE submittedBy = ?
    AND verified = false
    AND rejectedAt IS NULL
    ```
  - Display pending reward amount: 50 PXP per pending venue
  - Show list of pending venues with submission date
  - Update notification when venues are verified (show earned PXP)

---

## Epic 5: Community Verification & Rewards (1 story)

### WPB-3: Democratic Venue Verification and Scout Award

- **Status:** Groomed
- **Priority:** HIGH
- **User Story:** As community members, we would like to review this Venue for possible piano oriented jam sessions.
- **PXP Reward Structure:**
  - **25 PXP** per verifier (immediate reward when venue is verified)
  - **50 PXP** to original scout (retroactive reward after verification)
  - **Threshold:** 3+ community verifiers required to switch venue to verified status
- **Technical Requirements:**
  - Extend existing curator system to support multiple verifiers
  - Database schema:

    ```prisma
    model VenueVerification {
      id            Int      @id @default(autoincrement())
      venueId       Int
      verifierAddress String
      approved      Boolean
      verifiedAt    DateTime @default(now())
      pxpAwarded    Boolean  @default(false)
      txHash        String?  // Celo transaction hash

      venue         Venue    @relation(fields: [venueId], references: [id])
    }
    ```

  - Logic:
    1. Track each verifier's approval/rejection
    2. When 3rd verifier approves:
       - Set venue.verified = true
       - Award 25 PXP to each verifier (3 transactions)
       - Award 50 PXP to original scout (1 transaction)
       - Record all transactions in PostgreSQL
    3. Show notification to all parties

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Priority:** Critical path items first

1. **Musician Profile Infrastructure**
   - Create Prisma schema for MusicianProfile model
   - Run migrations
   - Create base profile page (WPB-140)
   - Update navigation menu

2. **QR Scanner Enhancement**
   - Implement WPB-88 (enhanced scanner)
   - Add deep linking support
   - Test venue/profile/payment QR flows

### Phase 2: Core Features (Week 2)

**Priority:** High-value user-facing features

3. **Profile Fields**
   - Implement WPB-109, 110, 111 (instruments, styles, experience)
   - Create profile edit form
   - Add validation

4. **QR Generation**
   - Implement WPB-90 (QR button on venue pages)
   - Create QR config API endpoint
   - Store QR settings in PostgreSQL

### Phase 3: Rewards & Polish (Week 3)

**Priority:** PXP token integration

5. **PXP Welcome Reward**
   - Implement WPB-30 (welcome bonus)
   - Create Celo transaction logic
   - Add transaction logging to PostgreSQL

6. **Pending Rewards Notification**
   - Implement WPB-34 (scout notifications)
   - Create dashboard component

### Phase 4: Advanced Features (Week 4)

**Priority:** Complex features and polish

7. **Democratic Verification**
   - Implement WPB-3 (multi-verifier system)
   - Create VenueVerification model
   - Implement 3-verifier threshold logic
   - Award PXP to verifiers and scouts

8. **Remaining Profile Fields**
   - Implement WPB-112, 113, 114 (availability, portfolio, repertoire)
   - Add social media links
   - Add recording links

9. **Print Templates**
   - Implement WPB-91 (print-ready QR templates)
   - Install dependencies (html2canvas, jsPDF, jszip)
   - Create export functionality

---

## Database Schema Updates Required

```prisma
// New model for musician profiles
model MusicianProfile {
  id                  Int      @id @default(autoincrement())
  walletAddress       String   @unique

  // WPB-109: Instruments
  instruments         String[]

  // WPB-110: Musical styles & genres
  musicalStyles       String[]
  genres              String[]

  // WPB-111: Experience level
  experienceLevel     String?  // "Beginner", "Intermediate", "Advanced", "Professional"
  yearsPlaying        Int?

  // WPB-112: Availability
  availableForGigs    Boolean  @default(false)
  availableForCollab  Boolean  @default(false)
  availabilityNotes   String?  @db.Text

  // WPB-113: Performance portfolio
  recordingLinks      String[] // YouTube, SoundCloud, etc.
  socialMedia         Json?    // {youtube: "", instagram: "", etc.}

  // WPB-114: Repertoire
  repertoire          String[] // List of songs/pieces

  // Metadata
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// Extend existing Venue model
model Venue {
  // ... existing fields ...

  // WPB-90: QR Code generation
  qrCodeGenerated     Boolean  @default(false)
  qrCardStyle         String?

  // WPB-3: Multi-verifier relationship
  verifications       VenueVerification[]
}

// New model for democratic verification
model VenueVerification {
  id              Int      @id @default(autoincrement())
  venueId         Int
  verifierAddress String
  approved        Boolean
  verifiedAt      DateTime @default(now())
  pxpAwarded      Boolean  @default(false)
  txHash          String?  // Celo transaction hash

  venue           Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)

  @@unique([venueId, verifierAddress])
  @@index([venueId])
  @@index([verifierAddress])
}

// Transaction tracking for PXP rewards
model Transaction {
  id            Int      @id @default(autoincrement())
  walletAddress String
  amount        Decimal  @db.Decimal(10, 2)
  type          String   // "WELCOME_REWARD", "VERIFIER_REWARD", "SCOUT_REWARD"
  relatedId     Int?     // Venue ID for scout/verifier rewards
  txHash        String?  // Celo blockchain transaction hash
  status        String   @default("PENDING") // "PENDING", "COMPLETED", "FAILED"
  createdAt     DateTime @default(now())

  @@index([walletAddress])
  @@index([type])
  @@index([status])
}
```

---

## New Dependencies to Install

```bash
yarn add html2canvas jspdf jszip
```

---

## API Endpoints to Create

1. **Profile Management**
   - `GET /api/profile/[address]` - Get musician profile
   - `PUT /api/profile/[address]` - Update musician profile
   - `POST /api/profile/[address]` - Create musician profile

2. **QR Configuration**
   - `PUT /api/venues/[venueId]/qr-config` - Save QR card style

3. **PXP Rewards**
   - `POST /api/rewards/welcome` - Award welcome bonus
   - `GET /api/rewards/pending` - Get user's pending rewards
   - `POST /api/rewards/verification` - Award verification rewards

4. **Verification**
   - `POST /api/venues/[venueId]/verify` - Submit verification vote
   - `GET /api/venues/[venueId]/verifications` - Get all verifications

---

## Testing Checklist

### Profile System

- [ ] Create new profile with all fields
- [ ] Update existing profile
- [ ] View other users' profiles
- [ ] Navigation menu shows "My Profile" instead of "Projects"
- [ ] Profile linked to wallet address

### QR Code System

- [ ] Scan venue QR → Routes to venue page
- [ ] Scan profile QR → Routes to profile page
- [ ] Scan payment QR → Opens payment modal
- [ ] Generate QR code from venue page (permissions check)
- [ ] Export QR as PNG (300 DPI)
- [ ] Export QR as PDF
- [ ] Export multiple QRs as ZIP

### PXP Rewards

- [ ] New wallet connection → Receives welcome PXP
- [ ] Welcome transaction recorded in PostgreSQL
- [ ] Welcome transaction recorded on Celo blockchain
- [ ] Pending rewards notification shows correct venues
- [ ] Pending rewards shows correct PXP amount (50 per venue)
- [ ] 3 verifiers approve venue → All receive 25 PXP
- [ ] Scout receives 50 PXP after venue verified
- [ ] All transactions recorded in PostgreSQL
- [ ] All transactions recorded on Celo blockchain

### Democratic Verification

- [ ] Multiple verifiers can vote on same venue
- [ ] Venue becomes verified after 3 approvals
- [ ] PXP awarded to all verifiers automatically
- [ ] PXP awarded to scout automatically
- [ ] Cannot verify same venue twice with same wallet
- [ ] Rejected votes tracked correctly

---

## Known Limitations & Future Work

### NOT in Sprint 2:

- **IPFS integration** - Reserved for future sprints (audio file storage with timestamps)
- **Advanced search/filtering** - Basic profile viewing only
- **Profile discovery page** - Individual profiles only, no browse/search
- **Messaging system** - Profiles are read-only contact info
- **Event booking system** - Availability is informational only

### Future Enhancements (Later Sprints):

- Audio file uploads to IPFS with date/time metadata
- Profile search and filtering
- Musician discovery page
- Direct messaging between musicians
- Event/gig booking integration
- Profile analytics (views, contacts)

---

## Success Metrics

- [ ] All 7 musician profile fields functional
- [ ] At least 5 test profiles created with complete data
- [ ] QR code generation working for 10+ venues
- [ ] QR scanner successfully routing to venue/profile/payment pages
- [ ] At least 3 welcome rewards successfully distributed
- [ ] Democratic verification working with 3+ verifiers on test venues
- [ ] All PXP transactions recorded on Celo blockchain
- [ ] All transactions logged in PostgreSQL
- [ ] Print templates generating 300 DPI exports

---

## Sprint 2 Risks & Mitigations

### Risk 1: Celo Blockchain Integration Complexity

- **Mitigation:** Start with welcome rewards (simpler) before democratic verification
- **Fallback:** Record transactions in PostgreSQL first, sync to blockchain async

### Risk 2: QR Code Print Quality

- **Mitigation:** Test early with 300 DPI exports, get stakeholder approval
- **Fallback:** Provide web-based QR codes if print quality issues persist

### Risk 3: Musician Profile Scope Creep

- **Mitigation:** Implement in phases (Phase 2 & Phase 4), prioritize core fields first
- **Fallback:** Defer WPB-112, 113, 114 to Sprint 3 if needed

---

## Daily Standup Template

**What I completed yesterday:**

- [ ] Story ID and brief description

**What I'm working on today:**

- [ ] Story ID and brief description

**Blockers:**

- [ ] Any impediments to progress

**PXP Integration Status:**

- [ ] Transactions tested on Celo testnet?
- [ ] PostgreSQL transaction log working?

---

## Sprint 2 Definition of Done

A story is considered "Done" when:

- [ ] Code implemented and tested locally
- [ ] Database migrations run successfully
- [ ] API endpoints tested with Postman
- [ ] UI components responsive on mobile and desktop
- [ ] PXP transactions (if applicable) recorded in PostgreSQL
- [ ] PXP transactions (if applicable) recorded on Celo blockchain
- [ ] No console errors in browser
- [ ] Code committed to git with descriptive commit message
- [ ] Story acceptance criteria met and verified

---

**Last Updated:** 2025-10-29
**Document Version:** 1.0 (Corrected)
