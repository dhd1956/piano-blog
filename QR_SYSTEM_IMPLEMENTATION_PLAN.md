# QR Code System Implementation Plan

## Overview

Enhanced QR code system for Piano Style Platform enabling:

- **Venue QR Codes**: Physical/digital cards for venues with app info, venue details, and optional PXP payment
- **User Profile QR Codes**: LinkedIn-style profile cards with user info and optional PXP transfer capability

## Implementation Status

### ✅ COMPLETED (Phase 1)

#### 1. QR Profile Types (`/types/qr-profile.ts`)

Complete type definitions and interfaces:

- `VenueQRData` - Venue information + app description + optional payment
- `UserProfileQRData` - User profile with bio, skills, social links + optional payment
- `QRCardLayout` - Print-friendly layouts (business card, postcard, poster, sticker, table tent, badge)
- `QRCardTheme` - Styling options with 4 default themes (piano, elegant, minimal, vibrant)
- `PaymentData` - Optional PXP payment structure
- `UserBadge` - Achievement badges (verified_curator, top_scout, early_adopter, community_champion, piano_virtuoso, jam_host, venue_partner)
- Deep link format: `pianostyle://venue/{slug}` and `pianostyle://user/{address}`
- Validation helpers and utility functions

**Key Features**:

- 6 different card sizes with precise dimensions
- Error correction level support (L, M, Q, H)
- Print marks (bleed, crop marks, color bars)
- CMYK color space support for professional printing

#### 2. Prisma Schema Updates (`/prisma/schema.prisma`)

**Venue Model Additions**:

```prisma
qrCodeGenerated Boolean  @default(false)  // Track if QR generated
qrCardStyle     Json?                     // Saved QR preferences (theme, layout)
defaultPayment  Float?                    // Default PXP tip amount
```

**User Model Additions**:

```prisma
profileSlug    String?  @unique          // Custom URL slug (e.g., /profile/john-doe)
title          String?                   // Professional title ("Jazz Pianist")
skills         String[]                  // Array of skills/tags
socialLinks    Json?                     // Twitter, LinkedIn, GitHub, website
badges         String[]                  // Earned badge IDs
publicProfile  Boolean  @default(true)   // Profile visibility
showPXPBalance Boolean  @default(false)  // Show token balance publicly
qrCardStyle    Json?                     // Saved QR card preferences
```

**New Indexes**:

- `@@index([username])`
- `@@index([profileSlug])`

#### 3. VenueQRCard Component (`/components/qr/VenueQRCard.tsx`)

**Features Implemented**:

- Interactive customization panel
  - 6 layout sizes (business card, postcard, poster, sticker, table tent, badge)
  - 4 color themes with live preview
  - Toggle app description on/off
  - Optional PXP payment integration
  - Adjustable default tip amount
- Real-time card preview
- Export buttons (PNG/PDF - placeholders ready for html2canvas integration)
- Usage instructions for venue owners
- Responsive design

**Component Structure**:

- Main `VenueQRCard` component with state management
- Separate `VenueQRCardContent` for easier print styling
- Uses existing `QRCodeGenerator` component
- Generates proper QR data with deep links and payment info

**Default Configuration**:

- Layout: business-card (3.5" × 2")
- Theme: piano (blue/amber)
- QR size: 150px
- Error correction: H (30%)
- App description: "Discover piano-friendly venues and connect with the piano community. Scan to explore, share experiences, and earn PXP tokens!"

---

## 🚧 REMAINING COMPONENTS (Phase 2)

### Priority 1: Core User Features

#### 1. UserProfileQRCard Component (`/components/qr/UserProfileQRCard.tsx`)

**Purpose**: LinkedIn-style professional networking card

**Display Elements**:

- Profile header
  - Avatar/profile picture
  - Username and display name
  - Professional title (e.g., "Jazz Pianist", "Venue Scout")
  - Location
- Bio (max 150 characters for QR size optimization)
- PXP Statistics
  - Total PXP earned
  - Venues discovered
  - Verifications completed (if curator)
- Achievement badges (max 3-4 displayed)
  - ✅ Verified Curator
  - 🔍 Top Scout
  - 🌟 Early Adopter
  - 🏆 Community Champion
  - 🎹 Piano Virtuoso
  - 🎵 Jam Host
  - 🤝 Venue Partner
- Skills/tags (max 5 for space)
- Social links (max 3-4)
  - Twitter
  - LinkedIn
  - GitHub
  - Personal website
- Optional payment section
  - Wallet address for direct PXP transfers
  - Pre-filled tip amount

**Customization Options**:

- Same layout options as venue cards
- Same theme options
- Toggle stats visibility
- Toggle badge display
- Select which skills to highlight
- Set default networking/tip amount

**Technical Requirements**:

- Reuse `QRCodeGenerator` component
- Similar UI/UX to `VenueQRCard`
- Generate `UserProfileQRData` format
- Deep link: `pianostyle://user/{address}?username={name}&payment={amount}`
- Export to PNG/PDF

**Component Props**:

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
    badges: string[]
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

---

#### 2. Enhanced PXPQRScanner (`/components/payments/PXPQRScanner.tsx`)

**Purpose**: Parse and handle new QR code formats with intelligent routing

**Current State**:

- Handles Celo payment URIs and wallet addresses
- File location: `/components/payments/PXPQRScanner.tsx` (renamed from CAVQRScanner)

**Enhancements Needed**:

1. **Parse New QR Formats**:

   ```typescript
   // Venue QR Code
   {
     type: 'venue',
     version: '1.0',
     url: 'https://pianostyle.app/venues/blue-note-cafe',
     data: { venueId, slug, name, city, ... },
     payment?: { address, amount, token: 'PXP' }
   }

   // User Profile QR Code
   {
     type: 'user',
     version: '1.0',
     url: 'https://pianostyle.app/profile/0x123...',
     data: { walletAddress, username, bio, stats, ... },
     payment?: { address, amount, token: 'PXP' }
   }
   ```

2. **Handle Deep Links**:
   - `pianostyle://venue/{slug}?payment=10`
   - `pianostyle://user/{address}?username=john&payment=5`
   - Web URL fallbacks for non-app environments

3. **Routing Logic**:

   ```typescript
   if (isValidVenueQRData(data)) {
     // Option 1: Navigate to venue page
     router.push(`/venues/${data.data.slug}`)

     // Option 2: Show venue modal with payment option
     if (data.payment) {
       showPaymentModal({
         recipient: data.payment.address,
         amount: data.payment.amount,
         memo: `Tip for ${data.data.name}`,
       })
     }
   }

   if (isValidUserProfileQRData(data)) {
     // Navigate to user profile
     router.push(`/profile/${data.data.walletAddress}`)

     // Show payment option if included
     if (data.payment) {
       showPaymentModal({
         recipient: data.data.walletAddress,
         amount: data.payment.amount,
         memo: `Payment to ${data.data.username || 'User'}`,
       })
     }
   }
   ```

4. **Error Handling**:
   - Validate QR data structure
   - Handle malformed JSON
   - Version compatibility checks
   - Graceful fallback to web URLs

**New Functions to Add**:

```typescript
function parseVenueQR(data: string): VenueQRData | null
function parseUserProfileQR(data: string): UserProfileQRData | null
function handleVenueQRScan(data: VenueQRData): void
function handleUserProfileQRScan(data: UserProfileQRData): void
```

---

#### 3. User Profile Page (`/app/profile/[address]/page.tsx`)

**Purpose**: Public profile page accessible via wallet address or custom slug

**Route Patterns**:

- `/profile/0x123...abc` (by wallet address)
- `/profile/john-doe` (by custom slug)

**Page Sections**:

1. **Profile Header**
   - Large avatar/profile picture
   - Display name and username
   - Professional title
   - Location
   - Wallet address (shortened with copy button)
   - PXP balance (if `showPXPBalance` is true)
   - "Edit Profile" button (if viewing own profile)
   - "Send PXP" button (if viewing another user)
   - "Generate My QR Code" button (if own profile)

2. **About Section**
   - Bio (full text, not truncated)
   - Skills/expertise tags (clickable for filtering)
   - Social links with icons

3. **Achievement Badges**
   - Display all earned badges
   - Hover tooltips with descriptions
   - Date earned

4. **Statistics Panel**
   - Total PXP earned (if public)
   - Venues discovered
   - Venues verified (if curator)
   - Member since date
   - Last active

5. **Venues Section**
   - List of venues discovered by this user
   - Grid or list view
   - Filter by verified/unverified
   - Click to view venue details

6. **Recent Activity Timeline**
   - Venue submissions
   - Verifications completed
   - Reviews posted
   - PXP earned events
   - Limited to last 10-20 items

7. **QR Code Modal** (when "Generate My QR Code" clicked)
   - Shows `UserProfileQRCard` component
   - Customization options
   - Download buttons

**Privacy Controls**:

- Respect `publicProfile` setting
  - If false, show "This profile is private" message
  - Only profile owner can view
- Respect `showPXPBalance` setting
  - Hide token amounts if false
- Guest viewing vs authenticated viewing

**Data Fetching**:

```typescript
// Server component or API route
async function getProfileData(addressOrSlug: string) {
  // Try to find by wallet address first
  let user = await prisma.user.findUnique({
    where: { walletAddress: addressOrSlug.toLowerCase() },
  })

  // If not found, try by profile slug
  if (!user) {
    user = await prisma.user.findUnique({
      where: { profileSlug: addressOrSlug },
    })
  }

  // Check privacy settings
  if (!user?.publicProfile && !isOwnProfile) {
    return null
  }

  // Fetch related data
  const venues = await prisma.venue.findMany({
    where: { submittedBy: user.walletAddress },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })

  return { user, venues }
}
```

**UI Components**:

- Use existing venue cards for venues section
- Badge components with icons
- Timeline component for activity
- Modal for QR code generation

---

#### 4. Venue Page QR Generation (Update `/app/venues/[slug]/page.tsx`)

**Purpose**: Allow venue owners and curators to generate QR codes

**UI Addition**:

- New section on venue detail page: "Marketing Materials"
- Button: "🎨 Generate QR Code"
- Show if:
  - User is venue owner (walletAddress === venue.submittedBy)
  - User is authorized curator
  - User is admin

**Implementation**:

1. **Add Button to Venue Page**:

   ```tsx
   {
     canGenerateQR && (
       <section className="mt-8">
         <h3 className="mb-4 text-xl font-semibold">Marketing Materials</h3>
         <button onClick={() => setShowQRGenerator(true)} className="btn-primary">
           🎨 Generate QR Code for This Venue
         </button>
         {venue.qrCodeGenerated && (
           <p className="mt-2 text-sm text-gray-600">✓ QR code previously generated</p>
         )}
       </section>
     )
   }
   ```

2. **QR Generator Modal/Drawer**:

   ```tsx
   {
     showQRGenerator && (
       <Modal onClose={() => setShowQRGenerator(false)}>
         <VenueQRCard
           venueData={venue}
           config={savedConfig}
           onExport={(dataUrl) => {
             // Save to database
             updateVenue(venue.id, {
               qrCodeGenerated: true,
               qrCardStyle: config,
             })
           }}
         />
       </Modal>
     )
   }
   ```

3. **Load Saved Preferences**:

   ```typescript
   const savedConfig = venue.qrCardStyle ? JSON.parse(venue.qrCardStyle) : undefined
   ```

4. **Save Configuration**:
   ```typescript
   async function saveQRConfig(venueId: number, config: QRCardConfig) {
     await prisma.venue.update({
       where: { id: venueId },
       data: {
         qrCodeGenerated: true,
         qrCardStyle: config,
       },
     })
   }
   ```

**Permissions Check**:

```typescript
const canGenerateQR =
  currentUser?.walletAddress === venue.submittedBy ||
  currentUser?.isAuthorizedVerifier ||
  currentUser?.isAdmin
```

---

### Priority 2: Professional Printing Support

#### 5. Print-Ready Templates (`/components/qr/PrintTemplates.tsx`)

**Purpose**: Professional-grade printing support with industry standards

**Print Specifications**:

- Resolution: 300 DPI minimum
- Color space: CMYK for professional printing, RGB for digital
- Bleed: 0.125" (1/8 inch) beyond trim line
- Safe zone: 0.125" inside trim line (keep text/important elements here)
- File formats: High-res PNG, PDF/X-1a

**CSS Print Media Queries**:

```css
@media print {
  /* Hide non-printable elements */
  .no-print {
    display: none !important;
  }

  /* Page setup */
  @page {
    size: 3.5in 2in; /* Business card */
    margin: 0;
  }

  /* Print colors exactly */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Prevent page breaks inside cards */
  .qr-card {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
```

**Template Components**:

1. **BusinessCardTemplate**:
   - 3.5" × 2" (standard US business card)
   - Bleed: 3.625" × 2.125"
   - Safe zone: 3.25" × 1.75"
   - Front and back options

2. **PostcardTemplate**:
   - 4" × 6" (standard postcard)
   - Address side option
   - Postage guidelines

3. **PosterTemplate**:
   - 8.5" × 11" (letter size)
   - Optional fold marks
   - High-resolution QR code

4. **StickerTemplate**:
   - 3" × 3" (square)
   - Die-cut line indicators
   - Weather-resistant printing notes

5. **TableTentTemplate**:
   - 4" × 6" (folds to 4" × 3")
   - Fold line indicators
   - Double-sided design

6. **BadgeTemplate**:
   - 3" × 4" (standard badge/lanyard)
   - Hole punch indicator
   - Clip area safe zone

**Print Marks Component**:

```tsx
function PrintMarks({ showBleed, showCropMarks, showColorBars }) {
  return (
    <>
      {showBleed && <BleedArea />}
      {showCropMarks && <CropMarks />}
      {showColorBars && <CMYKColorBars />}
    </>
  )
}
```

**Export Utilities**:

```typescript
// High-DPI PNG export
async function exportToPNG(element: HTMLElement, dpi = 300): Promise<Blob>

// PDF generation with proper color space
async function exportToPDF(element: HTMLElement, colorSpace: 'RGB' | 'CMYK'): Promise<Blob>

// Batch export for multiple cards
async function batchExport(venues: Venue[], format: 'png' | 'pdf'): Promise<Zip>
```

**Integration with html2canvas**:

```typescript
import html2canvas from 'html2canvas'

async function captureCard(element: HTMLElement) {
  const canvas = await html2canvas(element, {
    scale: 3.125, // 300 DPI (300/96)
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
  })
  return canvas.toDataURL('image/png')
}
```

**Integration with jsPDF**:

```typescript
import jsPDF from 'jspdf'

async function generatePDF(cardElement: HTMLElement, size: QRCardLayout) {
  const dimensions = QR_CARD_SIZES[size]
  const pdf = new jsPDF({
    unit: dimensions.unit,
    format: [dimensions.width, dimensions.height],
    compress: true,
  })

  const canvas = await html2canvas(cardElement, { scale: 3.125 })
  const imgData = canvas.toDataURL('image/png')

  pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height)
  return pdf.save(`qr-card-${Date.now()}.pdf`)
}
```

---

## 🎯 ADDITIONAL FEATURES (Future Enhancements)

### 6. Admin Bulk QR Generator (`/app/admin/qr-generator/page.tsx`)

**Purpose**: Generate QR codes for all venues at once

**Features**:

- Select multiple venues or "all verified venues"
- Apply theme to all cards
- Batch customization
- Export as ZIP file
- Individual PDFs named by venue slug
- Mailing label generator (Avery templates)
- Track distribution (mark which venues received physical cards)

**UI**:

- Venue list with checkboxes
- Preview grid showing all cards
- Bulk actions toolbar
- Progress indicator during generation
- Download manager

---

### 7. QR Analytics Dashboard (`/app/analytics/qr-scans/page.tsx`)

**Purpose**: Track QR code performance and user engagement

**Metrics to Track**:

- Total scans per venue/user
- Unique scans vs repeat scans
- Geographic breakdown (country, city)
- Device breakdown (iOS, Android, desktop)
- Time-based trends (hourly, daily, weekly)
- Scan-to-action conversion rates:
  - Views → Profile visits
  - Views → Payments initiated
  - Views → Payments completed
  - Views → New user signups

**Implementation**:

- Add scan tracking to scanner component
- Store in database:

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
    converted    Boolean  @default(false)
    actionTaken  String?  // 'view' | 'payment' | 'signup'

    @@index([qrType, entityId])
    @@index([scannedAt])
  }
  ```

**Visualizations**:

- Line charts for scan trends
- Heatmap for geographic distribution
- Funnel chart for conversion
- Leaderboard for most-scanned venues/users

---

### 8. Profile Settings Page (`/app/profile/settings/page.tsx`)

**Purpose**: User-facing controls for profile management

**Sections**:

1. **Profile Information**:
   - Edit username, display name, bio
   - Upload avatar
   - Set professional title
   - Add/remove skills
   - Manage social links

2. **Privacy Settings**:
   - Toggle public profile
   - Toggle PXP balance visibility
   - Select which stats to show
   - Choose badge display preferences

3. **QR Card Customization**:
   - Save default theme
   - Select favorite layout
   - Set default payment amount
   - Preview personal QR card

4. **Notification Preferences**:
   - Email notifications
   - PXP payment alerts
   - Venue verification updates

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (✅ COMPLETED)

- [x] Create QR profile types and interfaces
- [x] Update Prisma schema for user profiles and venue QR settings
- [x] Create VenueQRCard component with print layouts

### Phase 2: Core Functionality (🚧 NEXT PRIORITY)

- [ ] Create UserProfileQRCard component
- [ ] Enhance PXPQRScanner to handle new QR formats
- [ ] Create user profile page (`/profile/[address]`)
- [ ] Add QR generation to venue pages

### Phase 3: Professional Features

- [ ] Create print-ready templates component
- [ ] Integrate html2canvas for PNG export
- [ ] Integrate jsPDF for PDF export
- [ ] Add batch export capabilities

### Phase 4: Administration (Optional)

- [ ] Create admin bulk QR generator
- [ ] Implement QR scan tracking
- [ ] Create analytics dashboard
- [ ] Build profile settings page

---

## 🔧 TECHNICAL NOTES

### Dependencies to Install:

```bash
yarn add html2canvas jspdf qrcode
yarn add -D @types/html2canvas @types/jspdf
```

### Database Migration:

```bash
# After schema updates
npx prisma migrate dev --name add_qr_profile_fields
npx prisma generate
```

### Deep Link Configuration:

- iOS: Configure Universal Links in `apple-app-site-association`
- Android: Configure App Links in `AndroidManifest.xml`
- Web fallback: Add redirects in `next.config.js`

### Testing Checklist:

- [ ] QR code generation works for all layouts
- [ ] QR codes scan correctly on iOS and Android
- [ ] Deep links navigate properly
- [ ] Payment integration works
- [ ] Print output matches design at 300 DPI
- [ ] Privacy settings are respected
- [ ] Export functions work without errors

---

## 📱 USE CASES

### Venue Owner:

1. Generate QR code for their venue
2. Customize theme and layout
3. Enable payment for tips
4. Download and print
5. Display at venue entrance
6. Track scans (future)

### Venue Visitor:

1. Scan QR code at venue
2. View venue details and app description
3. Optionally leave a PXP tip
4. Discover other venues nearby
5. Join the community

### Community Member:

1. Create professional profile
2. Generate personal QR card
3. Share at piano events/jam sessions
4. Network with other musicians
5. Exchange contact info and PXP
6. Build reputation through badges

### Curator:

1. Generate QR codes for verified venues
2. Distribute to venue owners
3. Track which venues have materials
4. Batch generate for new verifications

---

## 🎨 DESIGN PRINCIPLES

1. **Simplicity**: One-click QR generation
2. **Flexibility**: Multiple layouts and themes
3. **Professional**: Print-ready quality
4. **Dual Purpose**: Information + payment in one code
5. **Privacy**: User controls what's shared
6. **Accessibility**: Works offline after printing
7. **Analytics**: Track effectiveness (future)

---

## 📖 DOCUMENTATION NEEDS

- [ ] User guide: "How to generate venue QR codes"
- [ ] User guide: "How to create your profile QR card"
- [ ] Printing guide: "Best practices for physical QR codes"
- [ ] API documentation for QR data structures
- [ ] Scanner integration guide for mobile apps

---

## 🚀 LAUNCH STRATEGY

1. **Beta Test** (Phase 2 complete):
   - Select 5-10 venues for pilot
   - Generate and print QR codes
   - Collect feedback on scanning experience
   - Measure scan rates and conversions

2. **Soft Launch** (Phase 3 complete):
   - Enable for all verified venues
   - Announce to existing community
   - Provide printing guidelines
   - Monitor analytics

3. **Full Launch** (Phase 4 complete):
   - Public announcement
   - Marketing campaign
   - Partner with printing services
   - Scale admin tools

---

## 🎯 SUCCESS METRICS

- QR codes generated: Target 100+ venues
- QR codes scanned: Target 1000+ scans/month
- Scan-to-payment conversion: Target 5-10%
- New user signups via QR: Target 20-30/month
- User profile QR cards created: Target 50+

---

## 📝 NOTES

- All PXP references updated (previously CAV)
- Schema supports both public and private profiles
- Deep link format is extensible for future features
- Print templates use industry-standard dimensions
- Badge system allows for gamification expansion

---

**Last Updated**: 2025-09-30
**Status**: Phase 1 Complete, Phase 2 Ready to Begin
**Next Action**: Test current implementation, then proceed with UserProfileQRCard component
