# Sprint 2 - Web3 Piano Blog

## Issues

### Epic: Community verification & Rewards

#### WPB-3: Democratic Venue Verification and Scout Award

- **Type:** Story
- **Status:** Groomed
- **Priority:** Medium

**Description:**

As community members, we would like to review this Venue for possible piano oriented jam sessions.

Acceptance Criteria:

---

### Epic: Musician Profiles

#### WPB-140: Replace the 'Projects' menu item with 'My Profile;

- **Type:** Story
- **Status:** To Do
- **Priority:** Medium

**Description:**

As a user, I want to be able to have my own profile so that I may market myself in the community.

Do not delete any projects in the TailWinds blog, but it is not being used. A ‘My Profile’ menu item should be created instead.

---

#### WPB-114: Repertoire & Known Songs

- **Type:** Story
- **Status:** To Do
- **Priority:** Medium

**Description:**

As a

musician

I want to

list songs/pieces I know

So that

jam session hosts know what I can play

Acceptance Criteria:

Technical Notes:

---

#### WPB-113: Performance Portfolio

- **Type:** Story
- **Status:** To Do
- **Priority:** Medium

**Description:**

As a

musician

I want to

link my performance recordings and social media

So that

people can hear my playing

Acceptance Criteria:

Technical Notes:

---

#### WPB-112: Availability & Collaboration

- **Type:** Story
- **Status:** To Do
- **Priority:** Medium

**Description:**

As a

musician

I want to

indicate my availability for gigs and collaborations

So that

opportunities can find me

Acceptance Criteria:

Technical Notes:

---

#### WPB-111: Experience Level

- **Type:** Story
- **Status:** To Do
- **Priority:** Medium

**Description:**

As a

musician

I want to

indicate my experience level

So that

event hosts know if I'm suitable for their events

Acceptance Criteria:

Technical Notes:

---

#### WPB-110: Musical Style & Genre

- **Type:** Story
- **Status:** To Do
- **Priority:** Medium

**Description:**

As a

musician

I want to

specify my musical styles and genres

So that

I can connect with musicians who play similar music

Acceptance Criteria:

Technical Notes:

---

#### WPB-109: Instrument Profile

- **Type:** Story
- **Status:** To Do
- **Priority:** Medium

**Description:**

As a

musician

I want to

list the instruments I play

So that

other musicians and event hosts know my capabilities

Acceptance Criteria:

Technical Notes:

---

### Epic: QR Code Profile System

#### WPB-91: Create Print-Ready Templates Component

- **Type:** Story
- **Status:** ready for ist
- **Priority:** Medium

**Description:**

As a

venue owner

, I want

print-ready QR codes with industry standards

, so that

I can get professional printing without quality issues

.

Description:

Build print template component with CSS print media queries, proper dimensions, bleed marks, crop marks, and export utilities using html2canvas and jsPDF.

File:

/components/qr/PrintTemplates.tsx

Acceptance Criteria:

Print Specifications:

CSS Print Media Queries:

Export Functions:

Print Marks Component:

Dependencies to Install:

Technical Notes:

Definition of Done:

---

#### WPB-90: Add QR Generation to Venue Pages

- **Type:** Story
- **Status:** ready for ist
- **Priority:** Medium

**Description:**

As a

venue owner

, I want

a button on my venue page to generate QR codes

, so that

I can easily create marketing materials for my venue

.

Description:

Add "Generate QR Code" section to venue detail pages with permissions checking. Show VenueQRCard component in modal with customization and export options.

File to Update:

/app/venues/[slug]/page.tsx

Acceptance Criteria:

Permissions Logic:

UI Implementation:

Save Configuration:

Load Saved Preferences:

Technical Notes:

Definition of Done:

---

#### WPB-88: Enhance PXP QR Scanner for New Formats

- **Type:** Story
- **Status:** ready for ist
- **Priority:** Medium

**Description:**

As a

user

, I want

to scan QR codes and be taken to the right place

, so that

I can view venue details, user profiles, or make payments seamlessly

.

Description:

Extend existing PXPQRScanner component to parse venue and user profile QR codes, handle deep links, and route users to appropriate pages with optional payment modals.

Current File:

/components/payments/PXPQRScanner.tsx

Acceptance Criteria:

Routing Logic:

Error Handling:

Technical Implementation:

Definition of Done:

---

### Epic: User Onboarding and Identity Management

#### WPB-30: Receive reward for joining by Wallet

- **Type:** Story
- **Status:** ready for ist
- **Priority:** Medium

**Description:**

As a new user,

I want to receive a starting amount of PXP immediately after connecting my wallet so that I feel welcomed and can start participating.

---

### Epic: Venues Discovery & Content Management

#### WPB-34: Display pending reward notification

- **Type:** Story
- **Status:** ready for ist
- **Priority:** Medium

**Description:**

As a venue scout,

I want a pending reward notification so that I know my submission is being reviewed.

This may be in sprint 2 as it is PXP related. Perhaps a pending PXP amount and possibly a list of Venues that this Scout has provided?

---
