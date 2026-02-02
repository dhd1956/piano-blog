# Business Requirements Document

## "Developing My Piano Style" Platform

**Version:** 1.0
**Created:** January 31, 2026
**Status:** Living Document
**Owner:** Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Objectives](#2-business-objectives)
3. [Current State (Implemented Features)](#3-current-state-implemented-features)
4. [Sprint 3 Planned Features](#4-sprint-3-planned-features)
5. [Sprint 4+ Roadmap](#5-sprint-4-roadmap)
6. [Technical Architecture](#6-technical-architecture)
7. [Success Metrics](#7-success-metrics)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Risks & Dependencies](#9-risks--dependencies)

---

## 1. Executive Summary

### Platform Vision

"Developing My Piano Style" is a Next.js blog application that combines traditional blogging with blockchain-based venue submission, discovery, and a musician community. The platform serves as a hub for piano musicians to share experiences, discover piano-friendly venues, connect with fellow musicians, and earn rewards for community contributions.

### Target Users

| User Type             | Description                          | Primary Goals                                       |
| --------------------- | ------------------------------------ | --------------------------------------------------- |
| **Piano Musicians**   | Amateur to professional pianists     | Find venues, connect with musicians, track progress |
| **Venue Scouts**      | Community members discovering venues | Submit venues, earn PXP rewards                     |
| **Venue Owners**      | Establishments with pianos           | Get discovered, host events                         |
| **Music Enthusiasts** | Blog readers, event attendees        | Discover content, attend events                     |
| **Curators**          | Trusted verifiers                    | Validate venue submissions                          |

### Key Value Proposition

1. **Decentralized Venue Discovery** - Blockchain-verified piano venue registry
2. **Community Rewards** - PXP token system incentivizes contributions
3. **Web 2.5 Authentication** - Flexible login (email, Google, MetaMask) reduces onboarding friction
4. **Musician Network** - Connect, collaborate, and find gig opportunities
5. **Event Coordination** - Organize jam sessions, gigs, and community events

---

## 2. Business Objectives

### Primary Objectives

| Objective               | Description                            | Target Timeline |
| ----------------------- | -------------------------------------- | --------------- |
| **Community Growth**    | Build active musician community        | Ongoing         |
| **Venue Coverage**      | Comprehensive piano venue database     | Q1-Q2 2026      |
| **User Engagement**     | Increase daily active users            | Q2 2026         |
| **Platform Stickiness** | Improve retention through gamification | Q2 2026         |

### Strategic Goals

1. **Create a community hub** for piano musicians to share knowledge and experiences
2. **Enable decentralized venue discovery** through blockchain verification
3. **Gamify community participation** through PXP rewards system
4. **Reduce onboarding friction** with Web 2.5 authentication (no crypto required)
5. **Foster collaboration** through events and musician directory

### Key Performance Indicators (KPIs)

| Metric                    | Current | Target | Timeline |
| ------------------------- | ------- | ------ | -------- |
| Monthly Active Users      | -       | 500    | Q2 2026  |
| Verified Venues           | ~10     | 100    | Q2 2026  |
| Events Created/Month      | -       | 20     | Q2 2026  |
| User Retention (7-day)    | -       | 40%    | Q2 2026  |
| Welcome Reward Claim Rate | -       | 80%    | Q1 2026  |

---

## 3. Current State (Implemented Features)

### 3.1 Blog System

**Status:** Production Ready

| Feature             | Description                     | Implementation              |
| ------------------- | ------------------------------- | --------------------------- |
| MDX Content         | Blog posts with rich formatting | Contentlayer2 processing    |
| Tag System          | Categorization and filtering    | Auto-generated tag pages    |
| Search              | Full-text search                | Kbar-powered search index   |
| Pagination          | Paginated post listings         | Custom pagination component |
| Dark Mode           | Theme toggle                    | Tailwind CSS dark mode      |
| Syntax Highlighting | Code blocks                     | Rehype plugins              |
| Math Equations      | LaTeX support                   | KaTeX integration           |
| Author Profiles     | Multi-author support            | MDX author files            |

**Key Files:**

- Content: `data/blog/*.mdx`
- Configuration: `contentlayer.config.ts`
- Metadata: `data/siteMetadata.js`

---

### 3.2 Authentication (Web 2.5)

**Status:** Production Ready

| Auth Method        | Description                | Provider                   |
| ------------------ | -------------------------- | -------------------------- |
| Email/Password     | Traditional authentication | Custom (bcrypt + sessions) |
| Google OAuth       | Social login               | Reown AppKit               |
| MetaMask           | Wallet connection          | Reown AppKit + wagmi       |
| Email Verification | Confirm email ownership    | Custom email service       |
| Password Reset     | Self-service recovery      | Token-based flow           |

**Features:**

- Session-based authentication
- Automatic session refresh
- Account merging across auth methods
- Profile completion tracking
- Multiple login methods per account

**Key Files:**

- Auth routes: `app/auth/*`
- Session management: `lib/auth.ts`, `lib/auth-middleware.ts`
- Provider: `context/ReownProvider.tsx`

---

### 3.3 User Profiles

**Status:** Production Ready

| Feature                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| Profile Pages          | `/profile/[address]` with customizable info       |
| Profile Editing        | Display name, bio, location, avatar, social links |
| Profile QR Codes       | Shareable QR codes with PDF export                |
| Profile Setup Wizard   | Progressive onboarding flow                       |
| PXP Balance Display    | Show earned tokens                                |
| Badges System          | Achievement display                               |
| Profile Slugs          | Custom URLs (`/profile/username`)                 |
| Leaderboard Visibility | Opt-in for public ranking                         |

**Database Fields:**

```
User: displayName, bio, location, title, skills[], socialLinks{},
      badges[], totalCAVEarned, profileSlug, profileCompleted,
      hasClaimedNewUserReward, firstPXPEarnedAt
```

**Key Files:**

- View: `app/profile/[address]/page.tsx`
- Edit: `app/profile/[address]/edit/page.tsx`
- Setup: `app/profile/setup/page.tsx`

---

### 3.4 Venue System

**Status:** Production Ready

| Feature            | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| Venue Directory    | `/venues` with filtering (verified/pending/rejected, city) |
| Venue Detail Pages | Full info: hours, accessibility, amenities                 |
| Venue Submission   | Public form for community submissions                      |
| Curator Dashboard  | Role-based verification interface                          |
| Venue QR Codes     | Printable venue cards                                      |
| Soft Delete        | Data integrity preservation                                |
| Rejection Workflow | Curator feedback with rejection reasons                    |

**Verification Status Flow:**

```
Pending → Verified (by curator)
       → Rejected (with reason)
       → Soft Deleted (preserves relationships)
```

**Smart Contract:**

- VenueRegistry: `0x325F81e26CF5A757dc63c85f2CE59621D1d1645E` (Celo Sepolia)

**Key Files:**

- List: `app/venues/page.tsx`
- Detail: `app/venueDetails/[id]/page.tsx`
- Submit: `app/submit/page.tsx`
- Curator: `app/curator/page.tsx`

---

### 3.5 Events System

**Status:** Production Ready

| Feature                  | Description                           |
| ------------------------ | ------------------------------------- |
| Event Creation           | `/events/create` with full form       |
| Event Listing            | `/events` with filters                |
| Event Details            | `/events/[id]` with full information  |
| Event Editing            | Host can modify events                |
| RSVP System              | Track attendance with capacity limits |
| Venue Association        | Link events to venues                 |
| Collapsible Venue Events | Show events on venue detail pages     |

**Event Types (10):**

- JAM_SESSION, GIG, CONCERT, OPEN_MIC, REHEARSAL
- MASTERCLASS, WORKSHOP, RECITAL, MEETUP, OTHER

**Event Statuses:**

- DRAFT, PUBLISHED, CANCELLED

**Database Schema:**

```prisma
Event: title, description, startDate, endDate, venueId, organizerId,
       eventType, status, isPublic, maxAttendees, price

EventRSVP: userId, eventId, status, attendedAt, rsvpedAt
```

**Key Files:**

- Components: `components/venue/VenueEvents.tsx`, `components/venue/EventCard.tsx`
- Types: `types/event.ts`
- API: `app/api/events/*`

---

### 3.6 Gamification (PXP System)

**Status:** Partially Complete (Configuration Complete, Auto-Distribution Partial)

| Feature            | Status     | Description                        |
| ------------------ | ---------- | ---------------------------------- |
| PXP Token          | Deployed   | Celo Sepolia testnet               |
| 17 Earning Actions | Configured | All actions visible in admin       |
| Leaderboard        | Active     | Opt-in public ranking              |
| Tipping            | Active     | Send PXP to other users            |
| Referral Program   | Configured | Earn for successful referrals      |
| Admin Config UI    | Complete   | `/admin/pxp-config`                |
| Welcome Reward     | Active     | 100 PXP on first wallet connection |
| Scout Reward       | Active     | 75 PXP when venue verified         |

**PXP Earning Actions (17 total):**

| Category       | Action                         | Reward     |
| -------------- | ------------------------------ | ---------- |
| **Onboarding** | Wallet connection (first time) | 100 PXP    |
| **Venue**      | Venue verified                 | 75 PXP     |
| **Referral**   | Profile created (referral)     | 50 PXP     |
| **Referral**   | First event (referral)         | 100 PXP    |
| **Referral**   | Max cap                        | 250 PXP    |
| **YouTube**    | Upload                         | 100 PXP    |
| **YouTube**    | Organizer bonus                | 50 PXP     |
| **YouTube**    | Milestones                     | 10-250 PXP |
| **Events**     | Host event                     | 75 PXP     |
| **Events**     | Perform at event               | 50 PXP     |
| **Events**     | Attend event                   | 25 PXP     |
| **Community**  | Write review                   | 15 PXP     |
| **Community**  | Upload photo                   | 10 PXP     |
| **Community**  | Complete profile               | 30 PXP     |

**Smart Contract:**

- PXP Token: `0x04eAE71832147D75D4B69B3FFB5d9514e8471c75` (Celo Sepolia)

**Key Files:**

- Config UI: `app/admin/pxp-config/page.tsx`
- Config API: `app/api/admin/pxp-config-db/route.ts`
- Contract Utils: `utils/rewards-contract.ts`

---

### 3.7 Community Features

**Status:** Basic Implementation

| Feature             | Status | Description                      |
| ------------------- | ------ | -------------------------------- |
| Musicians Directory | Basic  | `/musicians` (needs enhancement) |
| Community Dashboard | Active | `/community/dashboard`           |
| Leaderboard         | Active | PXP rankings                     |
| YouTube Integration | Active | Video submissions with rewards   |

**Key Files:**

- Dashboard: `app/community/dashboard/page.tsx`
- Musicians: `app/musicians/page.tsx`

---

### 3.8 Admin Features

**Status:** Production Ready

| Feature                  | Description                       |
| ------------------------ | --------------------------------- |
| PXP Reward Configuration | Configure all earning actions     |
| Curator Management       | Add/remove authorized curators    |
| Gas Sponsorship Settings | Configure transaction sponsorship |
| User Management          | View and manage users             |

**Key Files:**

- PXP Config: `app/admin/pxp-config/page.tsx`
- Curators: `app/admin/curators/page.tsx`

---

## 4. Sprint 3 Planned Features

**Sprint Status:** In Progress (20% Complete)
**Started:** December 31, 2025

### 4.1 PXP Auto-Distribution

| Story                    | Status   | Description                          |
| ------------------------ | -------- | ------------------------------------ |
| Welcome Reward (Backend) | Complete | 100 PXP on first wallet connection   |
| Scout Reward (Backend)   | Complete | 75 PXP when venue verified           |
| Pending Rewards UI       | Pending  | Notification badge + claim interface |
| Reward Claim Flow        | Pending  | One-click claim functionality        |

**Remaining Work:**

- Celebration toast when user earns welcome reward
- Notification UI when venue is verified
- Real-time PXP balance updates in UI

---

### 4.2 Enhanced Musician Profiles

| Story             | Status  | Description                     |
| ----------------- | ------- | ------------------------------- |
| Database Schema   | Pending | Add musician-specific fields    |
| Profile Edit Form | Pending | Multi-select instruments/genres |
| Profile Display   | Pending | Show new fields on profile      |

**New Fields to Add:**

```prisma
instruments       String[]   // Piano, Guitar, Drums, etc.
genres           String[]   // Jazz, Classical, Blues, etc.
experienceLevel  String?    // Beginner, Intermediate, Advanced, Professional
availability     String?    // Available, Limited, Not Available
performanceLinks Json?      // YouTube, SoundCloud, etc.
repertoire       String?    // Known songs/pieces
```

---

### 4.3 Venue Rejection Workflow

| Story                    | Status  | Description                        |
| ------------------------ | ------- | ---------------------------------- |
| Scout Notification       | Pending | Notify when venue rejected         |
| Filter Rejected          | Pending | Hide rejected from public listings |
| My Submissions Dashboard | Pending | `/my-submissions` page             |

**Current Gaps:**

- Scouts not notified of rejection
- Rejected venues visible in public list
- No submission history view

---

### 4.4 Notification Infrastructure

| Story            | Status  | Description                  |
| ---------------- | ------- | ---------------------------- |
| Database Model   | Pending | Notification table           |
| In-App Component | Pending | Bell icon with dropdown      |
| Preferences      | Pending | Toggle notifications by type |

**Notification Types:**

- REWARD_EARNED
- VENUE_VERIFIED
- VENUE_REJECTED
- EVENT_REMINDER
- RSVP_CONFIRMED
- PROFILE_VIEWED

---

## 5. Sprint 4+ Roadmap

### 5.1 Gas Sponsorship (HIGH PRIORITY - Quick Win)

**Status:** Proposed
**Effort:** 2-3 days
**Cost:** ~$25-30/month for 100 DAU

| Benefit                    | Description                  |
| -------------------------- | ---------------------------- |
| Gasless Transactions       | Users don't pay gas fees     |
| 73% Fewer Onboarding Steps | No crypto knowledge required |
| Web2-like Experience       | Seamless user experience     |

**Implementation:** Reown AppKit Paymaster with Pimlico/Biconomy

**User Journey Improvement:**

```
Before: 8 steps, ~10 minutes, high friction
After:  3 steps, ~30 seconds, seamless
```

---

### 5.2 Musicians Directory Enhancement

| Feature          | Description                             |
| ---------------- | --------------------------------------- |
| Search/Filter    | By location, instruments, styles        |
| Sort Options     | Recently active, reputation, experience |
| Advanced Filters | Availability, experience level          |

---

### 5.3 Social/Connection System

| Feature             | Description                      |
| ------------------- | -------------------------------- |
| Profile Actions     | Connect, Message, Invite buttons |
| Connection Requests | Send/accept/decline flow         |
| My Connections Page | Manage network                   |
| Activity Feed       | See connection activity          |

---

### 5.4 Democratic Verification (Deferred)

| Feature              | Description                |
| -------------------- | -------------------------- |
| 3-Verifier Consensus | Multiple curators vote     |
| Community Voting     | Distributed verification   |
| Verifier Reputation  | Track verification quality |

**Status:** Deferred - Current curator system adequate

---

## 6. Technical Architecture

### Technology Stack

| Layer             | Technology               |
| ----------------- | ------------------------ |
| Framework         | Next.js 15 (App Router)  |
| Language          | TypeScript               |
| Styling           | Tailwind CSS 4.0         |
| Content           | Contentlayer2 (MDX)      |
| Database          | PostgreSQL via Prisma    |
| Blockchain        | Celo Sepolia testnet     |
| Web3 Libraries    | wagmi, viem              |
| Wallet Connection | Reown AppKit             |
| Authentication    | Session + Wallet + OAuth |

### Smart Contracts

| Contract      | Address                                      | Network      |
| ------------- | -------------------------------------------- | ------------ |
| VenueRegistry | `0x325F81e26CF5A757dc63c85f2CE59621D1d1645E` | Celo Sepolia |
| PXP Token     | `0x04eAE71832147D75D4B69B3FFB5d9514e8471c75` | Celo Sepolia |

### Key Configuration Files

| File                        | Purpose                               |
| --------------------------- | ------------------------------------- |
| `next.config.js`            | CSP, image optimization, Contentlayer |
| `contentlayer.config.ts`    | MDX processing, frontmatter           |
| `tailwind.config.js`        | Theme configuration                   |
| `prisma/schema.prisma`      | Database schema                       |
| `context/ReownProvider.tsx` | Web3 provider configuration           |

---

## 7. Success Metrics

### Sprint 3 Success Criteria

| Metric                         | Target     | Measurement                      |
| ------------------------------ | ---------- | -------------------------------- |
| Welcome Reward Claim Rate      | 80%+       | New users claiming 100 PXP       |
| Scout Dashboard Usage          | 50%+       | Scouts viewing My Submissions    |
| Notification Preference Config | 60%+       | Users setting preferences        |
| Venue Verification Turnaround  | < 48 hours | Time from submission to decision |

### Platform Health Metrics

| Metric                   | Description                 | Target |
| ------------------------ | --------------------------- | ------ |
| Daily Active Users       | Users with session activity | 50+    |
| Weekly Venue Submissions | New venues submitted        | 10+    |
| Event Creation Rate      | New events per week         | 5+     |
| PXP Distribution Rate    | PXP earned per day          | 1000+  |

---

## 8. Non-Functional Requirements

### Performance

| Requirement                | Target       |
| -------------------------- | ------------ |
| Page Load Time             | < 3 seconds  |
| Time to Interactive        | < 5 seconds  |
| API Response Time          | < 500ms      |
| Blockchain TX Confirmation | < 10 seconds |

### Security

| Requirement       | Implementation               |
| ----------------- | ---------------------------- |
| CSP Headers       | Configured in next.config.js |
| CORS              | Restricted origins           |
| SQL Injection     | Prisma parameterized queries |
| XSS Prevention    | React auto-escaping          |
| Wallet Signatures | User approval required       |

### Accessibility

| Requirement         | Implementation           |
| ------------------- | ------------------------ |
| ARIA Labels         | All interactive elements |
| Keyboard Navigation | Full support             |
| Color Contrast      | WCAG AA compliant        |
| Screen Reader       | Semantic HTML            |

### Compatibility

| Requirement  | Support                                  |
| ------------ | ---------------------------------------- |
| Browsers     | Chrome, Firefox, Safari, Edge (latest 2) |
| Mobile       | iOS Safari, Chrome Mobile                |
| Screen Sizes | 320px to 2560px                          |
| Dark Mode    | Full support                             |

### Infrastructure

| Requirement     | Implementation       |
| --------------- | -------------------- |
| Hosting         | Vercel               |
| Database        | PostgreSQL (managed) |
| CDN             | Vercel Edge Network  |
| SSL             | Automatic HTTPS      |
| Edge Middleware | Supported            |

---

## 9. Risks & Dependencies

### Technical Risks

| Risk                     | Probability | Impact | Mitigation                   |
| ------------------------ | ----------- | ------ | ---------------------------- |
| Celo Testnet Instability | Low         | High   | Monitor uptime, fallback RPC |
| OAuth Provider Downtime  | Low         | Medium | Multiple auth methods        |
| Database Performance     | Low         | High   | Query optimization, indexing |
| Smart Contract Bugs      | Low         | High   | Testnet validation, audits   |

### Business Risks

| Risk               | Probability | Impact | Mitigation                             |
| ------------------ | ----------- | ------ | -------------------------------------- |
| Low User Adoption  | Medium      | High   | Simplified onboarding, gas sponsorship |
| Content Quality    | Medium      | Medium | Curator verification system            |
| Spam Submissions   | Medium      | Low    | Rate limiting, PXP cost                |
| Community Toxicity | Low         | Medium | Moderation tools                       |

### External Dependencies

| Dependency         | Provider              | Risk Level |
| ------------------ | --------------------- | ---------- |
| Blockchain Network | Celo                  | Low        |
| Wallet Connection  | Reown (WalletConnect) | Low        |
| OAuth              | Google                | Low        |
| Email Service      | Custom                | Medium     |
| Hosting            | Vercel                | Low        |

### Migration Considerations

| Item                            | Status   | Notes                   |
| ------------------------------- | -------- | ----------------------- |
| Alfajores → Sepolia             | Complete | January 2025            |
| CAVPayment → PXPPayment         | Complete | December 2025           |
| totalCAVEarned → totalPXPEarned | Pending  | Schema migration needed |
| Mainnet Migration               | Future   | Gas costs TBD           |

---

## Document History

| Version | Date             | Author           | Changes         |
| ------- | ---------------- | ---------------- | --------------- |
| 1.0     | January 31, 2026 | Development Team | Initial version |

---

## Appendix A: Sprint Documentation

| Document                | Location                                     |
| ----------------------- | -------------------------------------------- |
| Sprint 2 Status         | `docs/sprints/SPRINT2_STATUS.md`             |
| Sprint 2 Roadmap        | `docs/sprints/SPRINT2_COMPLETION_ROADMAP.md` |
| Sprint 3 Plan           | `docs/sprints/SPRINT3_PLAN.md`               |
| Gas Sponsorship Feature | `docs/sprints/GAS_SPONSORSHIP_FEATURE.md`    |
| Social Features Spec    | `docs/sprints/SPRINT_3_SOCIAL_FEATURES.md`   |

---

## Appendix B: API Endpoints Summary

### Authentication

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - Create account
- `POST /api/auth/logout` - End session
- `GET /api/auth/verify-email` - Verify email token

### Venues

- `GET /api/venues` - List venues
- `GET /api/venues/[id]` - Get venue details
- `POST /api/venues` - Submit new venue
- `PUT /api/venues/[id]` - Update venue (verify/reject)
- `DELETE /api/venues/[id]` - Soft delete venue

### Events

- `GET /api/events` - List events
- `GET /api/events/[id]` - Get event details
- `POST /api/events` - Create event
- `PUT /api/events/[id]` - Update event
- `POST /api/events/[id]/rsvp` - RSVP to event

### Profiles

- `GET /api/profile/[address]` - Get profile
- `PUT /api/profile/[address]` - Update profile

### Admin

- `GET /api/admin/pxp-config-db` - Get PXP config
- `PUT /api/admin/pxp-config-db` - Update PXP config

---

_This document is maintained as a living document and updated as the platform evolves._
