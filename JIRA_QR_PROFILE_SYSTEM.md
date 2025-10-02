# JIRA Stories: QR Profile System Implementation

**Project:** WPB - Web3 Piano Blog
**Epic:** QR Code Profile System (WPB-100)
**Sprint:** QR Profile & Marketing Materials Sprint
**Created:** 2025-09-30

---

## Epic: QR Code Profile System (WPB-100)

**Epic Summary:**
Implement comprehensive QR code system enabling venue marketing materials and professional user networking cards. Each QR code serves dual purposes: sharing information (venue details or user profiles) and enabling optional PXP token transfers.

**Business Value:**

- Drive offline-to-online user acquisition via venue QR codes
- Enable professional networking at piano events
- Provide free marketing materials for venue partners
- Bridge physical venue visits to digital platform engagement
- Facilitate community building through instant profile sharing

**Technical Scope:**

- Venue QR cards with 6 print layouts and customizable themes
- User profile QR cards (LinkedIn-style professional cards)
- Enhanced QR scanner supporting new data formats
- Public user profile pages
- Print-ready templates with professional specifications (300 DPI, CMYK)

**Epic Owner:** Product
**Technical Lead:** Engineering

---

## Stories

### Phase 1: Foundation (COMPLETED ✅)

---

#### WPB-101: Create QR Profile Type System

**Type:** Story
**Priority:** Highest
**Status:** ✅ Done
**Story Points:** 3

**User Story:**
As a **developer**, I want **comprehensive TypeScript types for QR code data structures**, so that **I can ensure type safety and consistency across all QR code implementations**.

**Description:**
Create type definitions for venue QR codes, user profile QR codes, card layouts, themes, and all supporting interfaces. Establish deep link format and validation helpers.

**Acceptance Criteria:**

- [x] `VenueQRData` interface includes venue info, app description, and optional payment
- [x] `UserProfileQRData` interface includes profile, stats, badges, and optional payment
- [x] Six QR card layouts defined with precise print dimensions
- [x] Four default themes (piano, elegant, minimal, vibrant) with color schemes
- [x] Badge system with 7 achievement types
- [x] Deep link format: `pianostyle://venue/{slug}` and `pianostyle://user/{address}`
- [x] Validation helpers: `isValidVenueQRData()`, `isValidUserProfileQRData()`
- [x] Utility functions: `generateDeepLink()`, `parseDeepLink()`

**Technical Notes:**

- File: `/types/qr-profile.ts`
- Print layouts: business-card (3.5"×2"), postcard (4"×6"), poster (8.5"×11"), sticker (3"×3"), table-tent (4"×6"), badge (3"×4")
- Error correction levels: L, M, Q, H (use H for durability on printed materials)
- Print specs: 300 DPI, optional CMYK color space, bleed support

**Definition of Done:**

- [x] All types exported and documented
- [x] No TypeScript errors
- [x] Validation functions tested
- [x] Badge definitions complete

---

#### WPB-102: Update Database Schema for QR Profiles

**Type:** Story
**Priority:** Highest
**Status:** ✅ Done
**Story Points:** 2

**User Story:**
As a **platform**, I want **database schema supporting QR profile features**, so that **I can persist user preferences and track QR code generation**.

**Description:**
Extend Prisma schema for Venue and User models to support QR card customization, profile information, badges, and privacy settings.

**Acceptance Criteria:**

- [x] Venue model includes: `qrCodeGenerated`, `qrCardStyle` (JSON), `defaultPayment`
- [x] User model includes: `profileSlug`, `title`, `skills`, `socialLinks` (JSON), `badges`
- [x] User privacy settings: `publicProfile`, `showPXPBalance`
- [x] User QR settings: `qrCardStyle` (JSON)
- [x] Proper indexes on `username`, `profileSlug`, `totalCAVEarned`
- [x] Migration created and tested

**Technical Notes:**

- File: `/prisma/schema.prisma`
- JSON fields allow flexible storage of theme/layout preferences
- `profileSlug` enables custom URLs like `/profile/john-pianist`
- `badges` array stores badge IDs (e.g., `["verified_curator", "top_scout"]`)

**Database Migration:**

```bash
npx prisma migrate dev --name add_qr_profile_fields
npx prisma generate
```

**Definition of Done:**

- [x] Schema updated without errors
- [x] Migration runs successfully
- [x] Prisma client regenerated
- [x] All indexes created

---

#### WPB-103: Build VenueQRCard Component

**Type:** Story
**Priority:** Highest
**Status:** ✅ Done
**Story Points:** 8

**User Story:**
As a **venue owner**, I want **to generate customized QR codes for my venue**, so that **I can print and display them to attract visitors and receive tips**.

**Description:**
Create interactive component for generating venue QR codes with live preview, multiple layouts, customizable themes, and export capabilities.

**Acceptance Criteria:**

- [x] Collapsible customization panel with all options
- [x] Layout selection: 6 sizes with dimension display
- [x] Theme selection: 4 themes with visual preview swatches
- [x] Toggle app description inclusion
- [x] Toggle PXP payment with amount input
- [x] Live preview updates as settings change
- [x] QR code displays venue name, city, piano info
- [x] Export buttons for PNG and PDF (placeholders ready)
- [x] Usage instructions included
- [x] Responsive design for mobile/desktop
- [x] Proper QR data structure with deep link

**Component Props:**

```typescript
interface VenueQRCardProps {
  venueData: {
    id: number
    slug: string
    name: string
    city: string
    address?: string
    description?: string
    hasPiano: boolean
    pianoType?: string
    phone?: string
    website?: string
    socialLinks?: any
    submittedBy: string
  }
  config?: Partial<QRCardConfig>
  onExport?: (dataUrl: string) => void
  className?: string
}
```

**Technical Implementation:**

- File: `/components/qr/VenueQRCard.tsx`
- Uses existing `QRCodeGenerator` component
- Generates JSON QR data with full venue details
- Screen preview at 96 DPI (scales for display)
- Print output at 300 DPI (future: html2canvas integration)
- State management with React hooks

**Design Notes:**

- Card layout scales based on selected size
- Theme colors apply to all elements consistently
- QR code center-aligned with proper spacing
- Payment call-to-action styled with theme colors
- Branding footer optional via theme setting

**Definition of Done:**

- [x] Component renders without errors
- [x] All customization options functional
- [x] Preview updates in real-time
- [x] QR data structure correct and scannable
- [x] Export handlers in place
- [x] Responsive on all screen sizes
- [x] Code reviewed and documented

---

### Phase 2: User Profiles & Scanning (NEXT PRIORITY)

---

#### WPB-104: Build UserProfileQRCard Component

**Type:** Story
**Priority:** High
**Status:** 📋 To Do
**Story Points:** 8

**User Story:**
As a **community member**, I want **to generate a professional QR code for my profile**, so that **I can share my information at piano events and receive tips or networking requests**.

**Description:**
Create LinkedIn-style profile card component with user stats, badges, skills, and optional payment. Mirror VenueQRCard UX with profile-specific customization.

**Acceptance Criteria:**

- [ ] Display user avatar, name, username, title
- [ ] Show bio (max 150 chars with truncation)
- [ ] Display PXP stats: tokens earned, venues discovered, verifications (if curator)
- [ ] Show up to 4 achievement badges with icons
- [ ] Display up to 5 skills as tags
- [ ] Show up to 3 social links (Twitter, LinkedIn, GitHub)
- [ ] Optional payment section with default tip amount
- [ ] Same customization options as venue cards (layouts, themes)
- [ ] Respect privacy settings: hide balance if `showPXPBalance` is false
- [ ] Export to PNG/PDF
- [ ] Generate deep link: `pianostyle://user/{address}`
- [ ] QR data includes all profile information in structured format

**Component Structure:**

```typescript
interface UserProfileQRCardProps {
  userData: {
    walletAddress: string
    username?: string
    displayName?: string
    profileSlug?: string
    bio?: string
    title?: string
    avatar?: string
    totalPXPEarned: number
    venuesDiscovered: number
    verificationsCompleted?: number
    badges: string[] // badge IDs
    skills: string[]
    socialLinks?: {
      twitter?: string
      linkedin?: string
      github?: string
      website?: string
    }
  }
  config?: Partial<QRCardConfig>
  onExport?: (dataUrl: string) => void
  className?: string
}
```

**Technical Notes:**

- Reuse customization panel from VenueQRCard
- Badge icons from `BADGE_DEFINITIONS` in types
- Truncate bio with ellipsis if > 150 chars
- Scale avatar image for print quality
- Validate social links format

**Design Specifications:**

- Business card layout optimized for profile info
- Badge placement: below title, before stats
- Skills as colored tags matching theme
- Social links as icon row at bottom
- Payment CTA: "Scan to connect & tip {amount} PXP"

**Definition of Done:**

- [ ] Component renders correctly
- [ ] All profile fields display properly
- [ ] Privacy settings respected
- [ ] QR generates valid UserProfileQRData
- [ ] Export functionality works
- [ ] Responsive design
- [ ] Unit tests pass

---

#### WPB-105: Enhance PXP QR Scanner for New Formats

**Type:** Story
**Priority:** High
**Status:** 📋 To Do
**Story Points:** 5

**User Story:**
As a **user**, I want **to scan QR codes and be taken to the right place**, so that **I can view venue details, user profiles, or make payments seamlessly**.

**Description:**
Extend existing PXPQRScanner component to parse venue and user profile QR codes, handle deep links, and route users to appropriate pages with optional payment modals.

**Current File:** `/components/payments/PXPQRScanner.tsx`

**Acceptance Criteria:**

- [ ] Parse `VenueQRData` JSON format
- [ ] Parse `UserProfileQRData` JSON format
- [ ] Parse deep links: `pianostyle://venue/{slug}` and `pianostyle://user/{address}`
- [ ] Handle web URL fallbacks
- [ ] Route venue QR → `/venues/{slug}` page
- [ ] Route user QR → `/profile/{address}` page
- [ ] Show payment modal if QR includes payment data
- [ ] Validate QR data version compatibility
- [ ] Display parsing errors gracefully
- [ ] Maintain backward compatibility with existing payment QR codes
- [ ] Log scan events for analytics (optional)

**Routing Logic:**

```typescript
// Venue QR detected
if (isValidVenueQRData(data)) {
  router.push(`/venues/${data.data.slug}`)

  if (data.payment) {
    showPaymentModal({
      recipient: data.payment.address,
      amount: data.payment.amount,
      memo: `Tip for ${data.data.name}`,
    })
  }
}

// User Profile QR detected
if (isValidUserProfileQRData(data)) {
  const destination = data.data.profileSlug
    ? `/profile/${data.data.profileSlug}`
    : `/profile/${data.data.walletAddress}`

  router.push(destination)

  if (data.payment) {
    showPaymentModal({
      recipient: data.data.walletAddress,
      amount: data.payment.amount,
      memo: `Payment to ${data.data.username || 'User'}`,
    })
  }
}
```

**Error Handling:**

- Malformed JSON → Show error message with QR data preview
- Unknown QR version → Prompt user to update app
- Network error on navigation → Retry option
- Invalid deep link → Fallback to web URL

**Technical Implementation:**

- Add `parseVenueQR()` function
- Add `parseUserProfileQR()` function
- Add `handleVenueQRScan()` handler
- Add `handleUserProfileQRScan()` handler
- Update `handleScan()` to check all formats
- Use Next.js router for navigation
- Integrate with existing payment modal

**Definition of Done:**

- [ ] All QR formats parsed correctly
- [ ] Navigation works for all routes
- [ ] Payment modal triggers when applicable
- [ ] Error handling tested
- [ ] Backward compatibility verified
- [ ] User testing successful

---

#### WPB-106: Create Public User Profile Page

**Type:** Story
**Priority:** High
**Status:** 📋 To Do
**Story Points:** 13

**User Story:**
As a **community member**, I want **a public profile page showing my contributions**, so that **others can learn about me and connect via PXP payments**.

**Description:**
Build public-facing user profile page accessible via wallet address or custom slug. Display profile info, stats, venues discovered, activity timeline, and QR generation capability.

**Route:** `/app/profile/[address]/page.tsx`

**URL Patterns:**

- `/profile/0x123...abc` (by wallet address)
- `/profile/john-pianist` (by profileSlug)

**Page Sections:**

1. **Profile Header** (top)
   - Large avatar (circular, 128px)
   - Display name (h1)
   - Username @handle (muted)
   - Professional title (e.g., "Jazz Pianist")
   - Location with pin icon
   - Shortened wallet address with copy button
   - PXP balance (if `showPXPBalance` enabled)
   - Action buttons:
     - "Edit Profile" (if own profile)
     - "Send PXP" (if viewing another user)
     - "Generate My QR Code" (if own profile)
     - "Share Profile" (copy link)

2. **About Section**
   - Full bio text
   - Skills as clickable tags
   - Social links with icons (Twitter, LinkedIn, GitHub, Website)

3. **Achievement Badges**
   - Grid of earned badges
   - Badge icon + name
   - Tooltip on hover with description
   - Date earned

4. **Statistics Panel** (cards or table)
   - Total PXP Earned (if public)
   - Venues Discovered
   - Venues Verified (if curator)
   - Member Since
   - Last Active

5. **Venues Discovered Section**
   - Grid of venue cards
   - Filter: All / Verified / Pending
   - Sort: Recent / Most PXP
   - Pagination (10 per page)
   - Click to view venue details

6. **Recent Activity Timeline** (optional)
   - Last 10-20 activities
   - Icons for each activity type
   - Relative timestamps
   - Types: venue submitted, venue verified, review posted, PXP earned

7. **QR Code Modal** (when "Generate My QR Code" clicked)
   - Shows `UserProfileQRCard` component
   - Full customization options
   - Export buttons

**Privacy Handling:**

```typescript
// If profile is private
if (!user.publicProfile && !isOwnProfile) {
  return (
    <div>
      <h1>Private Profile</h1>
      <p>This user has set their profile to private.</p>
    </div>
  )
}

// Hide balance if setting disabled
{user.showPXPBalance && (
  <div>Balance: {user.totalCAVEarned} PXP</div>
)}
```

**Data Fetching:**

```typescript
async function getProfileData(addressOrSlug: string) {
  // Try wallet address first
  let user = await prisma.user.findUnique({
    where: { walletAddress: addressOrSlug.toLowerCase() },
  })

  // Try profile slug
  if (!user) {
    user = await prisma.user.findUnique({
      where: { profileSlug: addressOrSlug },
    })
  }

  if (!user) return null

  // Fetch venues discovered
  const venues = await prisma.venue.findMany({
    where: { submittedBy: user.walletAddress },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return { user, venues }
}
```

**Acceptance Criteria:**

- [ ] Page loads via wallet address or slug
- [ ] All profile sections render correctly
- [ ] Privacy settings respected
- [ ] "Edit Profile" button shows for owner only
- [ ] "Send PXP" button functional
- [ ] "Generate QR Code" opens modal with UserProfileQRCard
- [ ] Venues grid displays correctly with filters
- [ ] Badge tooltips show descriptions
- [ ] Social links open in new tabs
- [ ] Copy wallet address works
- [ ] Share profile copies URL
- [ ] 404 page for non-existent profiles
- [ ] Responsive design for mobile/tablet/desktop
- [ ] Loading states for async data
- [ ] Error handling for network issues

**Technical Stack:**

- Next.js 15 App Router
- Server component for initial data
- Client components for interactions
- Prisma for database queries
- Tailwind CSS for styling

**Definition of Done:**

- [ ] Page functional end-to-end
- [ ] All acceptance criteria met
- [ ] Mobile responsive
- [ ] Privacy controls work
- [ ] Performance optimized
- [ ] SEO metadata included
- [ ] Accessibility tested

---

#### WPB-107: Add QR Generation to Venue Pages

**Type:** Story
**Priority:** Medium
**Status:** 📋 To Do
**Story Points:** 5

**User Story:**
As a **venue owner**, I want **a button on my venue page to generate QR codes**, so that **I can easily create marketing materials for my venue**.

**Description:**
Add "Generate QR Code" section to venue detail pages with permissions checking. Show VenueQRCard component in modal with customization and export options.

**File to Update:** `/app/venues/[slug]/page.tsx`

**Acceptance Criteria:**

- [ ] New "Marketing Materials" section appears on venue page
- [ ] "Generate QR Code" button visible to authorized users only
- [ ] Button shows ✓ indicator if QR previously generated
- [ ] Clicking button opens modal/drawer with VenueQRCard
- [ ] Modal loads saved preferences from `venue.qrCardStyle`
- [ ] User can customize and export QR code
- [ ] Export saves config to database
- [ ] Database updated: `qrCodeGenerated = true`, `qrCardStyle = JSON`
- [ ] Modal closeable with X button or outside click
- [ ] Keyboard navigation (Escape to close)

**Permissions Logic:**

```typescript
const canGenerateQR =
  currentUser?.walletAddress === venue.submittedBy ||
  currentUser?.isAuthorizedVerifier ||
  currentUser?.isAdmin
```

**UI Implementation:**

```tsx
{
  canGenerateQR && (
    <section className="mt-8 border-t border-gray-200 pt-8">
      <h3 className="mb-4 text-xl font-semibold">📱 Marketing Materials</h3>
      <p className="mb-4 text-gray-600">
        Generate a QR code for your venue to print and display at your location.
      </p>

      <button onClick={() => setShowQRGenerator(true)} className="btn-primary">
        🎨 Generate QR Code
      </button>

      {venue.qrCodeGenerated && (
        <p className="mt-2 text-sm text-green-600">✓ QR code previously generated</p>
      )}
    </section>
  )
}

{
  showQRGenerator && (
    <Modal onClose={() => setShowQRGenerator(false)}>
      <VenueQRCard
        venueData={venue}
        config={savedConfig}
        onExport={async (dataUrl) => {
          await saveQRConfig(venue.id, currentConfig)
          toast.success('QR code saved!')
        }}
      />
    </Modal>
  )
}
```

**Save Configuration:**

```typescript
async function saveQRConfig(venueId: number, config: QRCardConfig) {
  await fetch(`/api/venues/${venueId}/qr-config`, {
    method: 'POST',
    body: JSON.stringify(config),
  })

  // Or direct Prisma call
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      qrCodeGenerated: true,
      qrCardStyle: config,
      updatedAt: new Date(),
    },
  })
}
```

**Load Saved Preferences:**

```typescript
const savedConfig = venue.qrCardStyle ? (JSON.parse(venue.qrCardStyle) as QRCardConfig) : undefined
```

**Technical Notes:**

- Use dialog/modal component (Headless UI or Radix)
- Prevent body scroll when modal open
- Focus trap within modal
- Animate modal entrance/exit
- Toast notification on save success

**Definition of Done:**

- [ ] Button appears for authorized users
- [ ] Permissions enforced
- [ ] Modal displays VenueQRCard correctly
- [ ] Saved preferences load properly
- [ ] Export saves to database
- [ ] UI polished and accessible
- [ ] Mobile responsive

---

### Phase 3: Professional Printing

---

#### WPB-108: Create Print-Ready Templates Component

**Type:** Story
**Priority:** Medium
**Status:** 📋 To Do
**Story Points:** 8

**User Story:**
As a **venue owner**, I want **print-ready QR codes with industry standards**, so that **I can get professional printing without quality issues**.

**Description:**
Build print template component with CSS print media queries, proper dimensions, bleed marks, crop marks, and export utilities using html2canvas and jsPDF.

**File:** `/components/qr/PrintTemplates.tsx`

**Acceptance Criteria:**

- [ ] CSS print media queries for all layouts
- [ ] 300 DPI export resolution
- [ ] CMYK color space option for professional printing
- [ ] Bleed marks (0.125" beyond trim)
- [ ] Crop marks at corners
- [ ] Safe zone indicators (0.125" inside trim)
- [ ] Color calibration bars (optional)
- [ ] Templates for all 6 card sizes
- [ ] PNG export with high resolution
- [ ] PDF export with proper page size
- [ ] Batch export function for multiple cards
- [ ] Page break controls for multi-card prints

**Print Specifications:**

| Layout        | Size       | Bleed Size      | DPI |
| ------------- | ---------- | --------------- | --- |
| Business Card | 3.5" × 2"  | 3.625" × 2.125" | 300 |
| Postcard      | 4" × 6"    | 4.125" × 6.125" | 300 |
| Poster        | 8.5" × 11" | 8.75" × 11.25"  | 300 |
| Sticker       | 3" × 3"    | 3.125" × 3.125" | 300 |
| Table Tent    | 4" × 6"    | 4.125" × 6.125" | 300 |
| Badge         | 3" × 4"    | 3.125" × 4.125" | 300 |

**CSS Print Media Queries:**

```css
@media print {
  .no-print {
    display: none !important;
  }

  @page {
    size: 3.5in 2in;
    margin: 0;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .qr-card {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
```

**Export Functions:**

```typescript
// High-DPI PNG export
async function exportToPNG(element: HTMLElement, dpi = 300): Promise<Blob> {
  const scale = dpi / 96
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
  })
  return canvas.toBlob()
}

// PDF generation
async function exportToPDF(
  element: HTMLElement,
  layout: QRCardLayout,
  colorSpace: 'RGB' | 'CMYK' = 'RGB'
): Promise<Blob> {
  const dimensions = QR_CARD_SIZES[layout]
  const pdf = new jsPDF({
    unit: dimensions.unit,
    format: [dimensions.width, dimensions.height],
    compress: true,
  })

  const canvas = await html2canvas(element, { scale: 3.125 })
  const imgData = canvas.toDataURL('image/png')

  pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height)

  return pdf.output('blob')
}

// Batch export as ZIP
async function batchExportPNG(venues: Venue[], config: QRCardConfig): Promise<Blob> {
  const zip = new JSZip()

  for (const venue of venues) {
    const element = renderVenueCard(venue, config)
    const blob = await exportToPNG(element)
    zip.file(`${venue.slug}.png`, blob)
  }

  return zip.generateAsync({ type: 'blob' })
}
```

**Print Marks Component:**

```tsx
function PrintMarks({ showBleed, showCropMarks, showColorBars }: PrintMarksProps) {
  return (
    <>
      {showBleed && <div className="print-bleed-area" />}

      {showCropMarks && (
        <>
          <CropMark position="top-left" />
          <CropMark position="top-right" />
          <CropMark position="bottom-left" />
          <CropMark position="bottom-right" />
        </>
      )}

      {showColorBars && <CMYKColorBars />}
    </>
  )
}
```

**Dependencies to Install:**

```bash
yarn add html2canvas jspdf jszip
yarn add -D @types/html2canvas @types/jspdf
```

**Technical Notes:**

- html2canvas scale: 3.125 = 300 DPI / 96 DPI
- PDF compression for smaller file size
- CORS enabled for external images
- Use PNG for lossless quality
- Test with actual printers

**Definition of Done:**

- [ ] All export functions work
- [ ] Print quality verified at 300 DPI
- [ ] Bleed and crop marks display correctly
- [ ] PDF page size matches layout
- [ ] Batch export generates ZIP
- [ ] Color accuracy maintained
- [ ] File sizes reasonable
- [ ] Documentation complete

---

### Phase 4: Administration & Analytics (Future)

---

#### WPB-109: Create Admin Bulk QR Generator

**Type:** Story
**Priority:** Low
**Status:** 📋 Backlog
**Story Points:** 8

**User Story:**
As an **admin**, I want **to generate QR codes for multiple venues at once**, so that **I can efficiently distribute marketing materials to partners**.

**Description:**
Build admin interface for selecting multiple venues, applying bulk customization, and exporting as ZIP file with individual PDFs.

**File:** `/app/admin/qr-generator/page.tsx`

**Features:**

- Venue selection with checkboxes (all verified, by city, by tag)
- Preview grid showing all selected cards
- Bulk theme application
- Bulk layout selection
- Generate all button with progress indicator
- Export as ZIP (individual PDFs named by slug)
- Mailing label generator (Avery template compatible)
- Track distribution: mark venues as "materials sent"

**Permissions:**

- Admin role required
- Curator role optional (limited access)

**Definition of Done:**

- [ ] Admin interface functional
- [ ] Bulk generation works
- [ ] ZIP export with correct filenames
- [ ] Progress indicator accurate
- [ ] Distribution tracking persists

---

#### WPB-110: Implement QR Analytics Dashboard

**Type:** Story
**Priority:** Low
**Status:** 📋 Backlog
**Story Points:** 13

**User Story:**
As a **platform owner**, I want **to track QR code scan metrics**, so that **I can measure engagement and optimize the system**.

**Description:**
Create analytics dashboard showing QR scan statistics, geographic distribution, conversion rates, and trends over time.

**File:** `/app/analytics/qr-scans/page.tsx`

**Metrics to Track:**

- Total scans per venue/user
- Unique scans vs repeat scans
- Geographic breakdown (country, city)
- Device breakdown (iOS, Android, desktop)
- Time-based trends (hourly, daily, weekly, monthly)
- Scan-to-action conversion rates:
  - Scans → Profile views
  - Scans → Payments initiated
  - Scans → Payments completed
  - Scans → New user signups

**Database Schema:**

```prisma
model QRScan {
  id           Int      @id @default(autoincrement())
  qrType       String   // 'venue' | 'user'
  entityId     String   // venue slug or user address
  scannedAt    DateTime @default(now())
  userAgent    String?
  ipAddress    String?
  country      String?
  city         String?
  device       String?  // 'ios' | 'android' | 'desktop'
  converted    Boolean  @default(false)
  actionTaken  String?  // 'view' | 'payment' | 'signup'

  @@index([qrType, entityId])
  @@index([scannedAt])
}
```

**Visualizations:**

- Line chart: Scan trends over time
- Heatmap: Geographic distribution
- Funnel chart: Scan → View → Payment conversion
- Bar chart: Top venues/users by scans
- Pie chart: Device breakdown
- Leaderboard: Most-scanned entities

**Scan Tracking Implementation:**

```typescript
// In PXPQRScanner component
async function trackScan(data: VenueQRData | UserProfileQRData) {
  await fetch('/api/analytics/qr-scans', {
    method: 'POST',
    body: JSON.stringify({
      qrType: data.type,
      entityId: data.type === 'venue' ? data.data.slug : data.data.walletAddress,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
    }),
  })
}
```

**Privacy Considerations:**

- No PII stored (IP anonymized)
- Aggregate data only in public views
- User-specific data requires authentication
- GDPR compliant (data retention policy)

**Definition of Done:**

- [ ] Analytics dashboard displays metrics
- [ ] Charts render correctly
- [ ] Scan tracking works end-to-end
- [ ] Privacy controls implemented
- [ ] Performance optimized for large datasets

---

#### WPB-111: Build Profile Settings Page

**Type:** Story
**Priority:** Medium
**Status:** 📋 Backlog
**Story Points:** 8

**User Story:**
As a **user**, I want **to edit my profile and privacy settings**, so that **I can control what information is shared on my QR code and public profile**.

**Description:**
Create settings page where users can update profile information, manage privacy settings, and customize their QR card defaults.

**File:** `/app/profile/settings/page.tsx`

**Settings Sections:**

1. **Profile Information**
   - Username (unique)
   - Display name
   - Professional title
   - Bio (textarea, 500 char limit)
   - Location
   - Avatar upload (with cropping)
   - Profile slug (custom URL)

2. **Skills & Expertise**
   - Add/remove skills (max 10)
   - Drag to reorder
   - Select top 5 for QR card

3. **Social Links**
   - Twitter handle
   - LinkedIn profile
   - GitHub username
   - Personal website

4. **Privacy Settings**
   - Public profile toggle
   - Show PXP balance toggle
   - Show venues discovered toggle
   - Show verification count toggle
   - Show badges toggle

5. **QR Card Defaults**
   - Preferred theme
   - Preferred layout
   - Default tip amount
   - Include contact info toggle
   - Preview QR card with settings

6. **Notification Preferences**
   - Email notifications
   - Payment alerts
   - Verification updates
   - Community announcements

**Form Validation:**

- Username: 3-20 chars, alphanumeric + underscore
- Profile slug: 3-30 chars, lowercase, alphanumeric + dash
- Bio: 500 char max
- Website: Valid URL format
- Avatar: Max 5MB, PNG/JPG only

**Save Handling:**

```typescript
async function saveSettings(data: UserSettings) {
  const response = await fetch('/api/user/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  if (response.ok) {
    toast.success('Settings saved!')
    router.refresh()
  } else {
    toast.error('Failed to save settings')
  }
}
```

**Definition of Done:**

- [ ] All settings editable
- [ ] Form validation works
- [ ] Changes persist to database
- [ ] Preview updates in real-time
- [ ] Avatar upload functional
- [ ] Privacy controls enforced
- [ ] Success/error messages display

---

## Epic Completion Criteria

### Phase 1 (✅ DONE)

- [x] Type system complete and documented
- [x] Database schema updated and migrated
- [x] VenueQRCard component functional with all features

### Phase 2 (In Progress)

- [ ] UserProfileQRCard component complete
- [ ] Scanner handles all QR formats
- [ ] User profile pages live
- [ ] Venue pages have QR generation

### Phase 3

- [ ] Print templates production-ready
- [ ] Export functions tested with real printers
- [ ] Professional printing guidelines documented

### Phase 4 (Optional)

- [ ] Admin tools deployed
- [ ] Analytics tracking active
- [ ] Settings page available

---

## Testing Strategy

### Unit Tests

- Type validation functions
- QR data generation logic
- Deep link parsing
- Export utilities

### Integration Tests

- Database migrations
- QR generation end-to-end
- Scanner → navigation flow
- Payment modal integration

### User Acceptance Testing

- Print quality verification (300 DPI)
- QR scanning on iOS and Android
- Theme customization UX
- Profile privacy controls

### Performance Testing

- Large batch exports (100+ QR codes)
- Scanner performance on low-end devices
- Profile page load times
- Analytics query performance

---

## Risk Assessment

| Risk                        | Impact | Mitigation                                                                       |
| --------------------------- | ------ | -------------------------------------------------------------------------------- |
| QR codes too large to scan  | High   | Use error correction level H, compress JSON data, implement URL shortener        |
| Print quality issues        | Medium | Test with actual printers, provide printing guidelines, support multiple formats |
| Privacy violations          | High   | Implement strict privacy controls, audit all data sharing, GDPR compliance       |
| Performance with many scans | Medium | Index database properly, implement caching, use pagination                       |
| Deep links don't work       | Medium | Provide web URL fallbacks, test on multiple devices                              |

---

## Dependencies

### External Libraries

- `qrcode` v1.5.4 - QR code generation
- `html2canvas` - DOM to canvas conversion
- `jspdf` - PDF generation
- `jszip` - ZIP file creation
- Existing: `@celo/contractkit`, Web3.js

### Internal Dependencies

- Existing QRCodeGenerator component
- Existing PXP payment system
- User authentication system
- Venue database
- Prisma ORM

### Infrastructure

- PostgreSQL database
- Next.js 15 App Router
- Celo testnet for payments
- Storage for QR analytics (optional)

---

## Launch Plan

### Beta Test (2 weeks)

- Select 5-10 partner venues
- Generate and distribute QR codes
- Collect feedback on:
  - Print quality
  - Scanning reliability
  - User flow clarity
  - Payment conversion

### Soft Launch (1 month)

- Enable for all verified venues
- Announce to existing community
- Provide printing templates
- Monitor analytics
- Iterate based on feedback

### Full Launch

- Public announcement
- Marketing campaign
- Partner with local print shops
- Scale admin tools
- Community education

---

## Success Metrics

### Short-term (3 months)

- ✅ 100+ venue QR codes generated
- ✅ 50+ user profile QR cards created
- ✅ 1000+ QR code scans
- ✅ 5% scan-to-payment conversion
- ✅ 20+ new signups via QR

### Long-term (1 year)

- ✅ 500+ venues with QR codes
- ✅ 200+ active user profiles
- ✅ 10,000+ monthly scans
- ✅ 10% scan-to-payment conversion
- ✅ 500+ community connections made

---

## Documentation Requirements

- [ ] User guide: "Generating Venue QR Codes"
- [ ] User guide: "Creating Your Profile QR Card"
- [ ] Printing guide: "Professional QR Code Printing"
- [ ] Developer docs: QR data structure specification
- [ ] API documentation for QR analytics
- [ ] Admin guide: "Bulk QR Generation"

---

**Last Updated:** 2025-09-30
**Epic Status:** Phase 1 Complete (3/11 stories done)
**Next Up:** WPB-104 (UserProfileQRCard Component)
