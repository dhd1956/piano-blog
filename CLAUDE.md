# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Global Piano Network" - a Next.js blog application that combines traditional blogging with blockchain-based venue submission and discovery. The project is built on the Tailwind Next.js Starter Blog template and extended with Celo blockchain integration for a decentralized piano venue registry and musician's community.

## Core Architecture

### Next.js App Structure (Next.js 15 + App Router)

- **App Router**: Uses Next.js App Router with TypeScript
- **Content Management**: Contentlayer2 handles MDX blog content with frontmatter processing
- **Styling**: Tailwind CSS 4.0 with custom themes and responsive design
- **State**: Client-side state management with React hooks

### Web3 Integration

- **Blockchain**: Celo Sepolia testnet integration (migrated from Alfajores)
- **Contract Address**: VenueRegistry at `0x325F81e26CF5A757dc63c85f2CE59621D1d1645E`
- **Connection**: Reown AppKit (formerly WalletConnect) with MetaMask, Google OAuth, and email login
- **Libraries**: @reown/appkit, @celo/contractkit, wagmi, viem

### Key Features

1. **Blog System**: MDX-based blog with Contentlayer for content management
2. **Venue Registry**: Blockchain-based venue submission and verification system
3. **Web3 Authentication**: Multiple login methods (MetaMask, Google OAuth, email) via Reown AppKit
4. **User Profiles**: Customizable profiles with musician details, PXP rewards, badges
5. **Curator System**: Manual venue verification by authorized curators
6. **Events System**: Community events with RSVP tracking

## Development Commands

### Primary Commands

- `yarn dev` - Start development server (preferred over npm due to yarn.lock and packageManager field)
- `yarn build` - Build production bundle with Contentlayer processing
- `yarn start` - Start production server
- `yarn lint` - Run ESLint with auto-fix for app, components, layouts, scripts

### Package Management

- Use `yarn` (version 3.6.1 specified in packageManager field)
- `yarn install` - Install dependencies

### Building & Analysis

- `yarn analyze` - Build with bundle analyzer (ANALYZE=true)

## Smart Contract Integration

### Contract Structure

The VenueRegistry contract manages:

- Venue submissions with IPFS metadata storage
- Curator-based verification system
- Reward distribution (TCoin tokens)
- City-based venue filtering
- Uniqueness checks to prevent duplicates

### Key Contract Methods

- `submitVenue(venue)` - Submit new venue for verification
- `getVenueById(id)` - Retrieve venue by ID
- `getVenuesWithPianos(city)` - Filter venues by city and piano availability
- `venueCount()` - Get total venue count

### Frontend-Contract Interaction

- Contract ABI definitions embedded in React components
- Direct Web3 calls using MetaMask provider
- Real-time venue data loading from blockchain
- Form submission triggers smart contract transactions

## Content Management

### Blog Content

- **Location**: `data/blog/*.mdx`
- **Processing**: Contentlayer2 with MDX plugins for syntax highlighting, math, citations
- **Frontmatter**: Support for title, date, tags, authors, draft status, summary
- **Search**: Kbar-powered search with auto-generated search index

### Site Configuration

- **Metadata**: `data/siteMetadata.js` - site title, author, social links, analytics
- **Navigation**: `data/headerNavLinks.ts` - customize navigation menu
- **Authors**: `data/authors/*.mdx` - author profiles with social links

## Custom Pages & Components

### Web3 Pages

- `/venues` - Display all venues from blockchain with filtering
- `/submit` - Venue submission form with wallet integration
- `/curator` - Curator verification interface (if implemented)

### Key Components

- `components/web3/WalletConnection.tsx` - MetaMask wallet connection
- `components/MDXComponents.tsx` - Custom MDX components
- `layouts/` - Blog post and listing layouts

## Environment & Configuration

### Required Environment Variables

- `NEXT_UMAMI_ID` - Analytics tracking ID
- `NEXT_PUBLIC_GISCUS_*` - Comment system configuration
- Network configuration handled via MetaMask provider

### Important Configuration Files

- `next.config.js` - Content Security Policy, image optimization, Contentlayer integration
- `contentlayer.config.ts` - MDX processing, frontmatter schema, tag generation
- `tailwind.config.js` - Tailwind configuration (check for custom theme settings)

## Development Guidelines

### Web3 Development

- Always check wallet connection before contract interactions
- Handle network switching to Celo Sepolia (chainId: 11142220 / 0xaa044c)
- Use proper error handling for blockchain transactions
- Simulate IPFS hashes during development (production should use real IPFS)

### Content Development

- Blog posts go in `data/blog/` as `.mdx` files
- Use proper frontmatter structure for post metadata
- Images in `public/static/images/` with Next.js Image optimization
- Tag system automatically generates tag pages and counts

### Component Development

- Follow existing component patterns in `components/`
- Use TypeScript for all new components
- Leverage Tailwind classes for styling consistency
- MDX components go in `components/MDXComponents.tsx`

## Security Considerations

- Content Security Policy configured in next.config.js (includes WalletConnect domains for OAuth)
- Web3 interactions require user wallet approval
- No private keys stored in frontend code
- IPFS hashes used for extended venue data storage

## Current Implementation Status

### Venue Events Display (Completed - 2025-12-01)

**Feature**: Collapsible events section on individual venue detail pages

**Implementation Plan**: See `.claude/plans/radiant-conjuring-peach.md` for full details

**Status: ✅ Production Ready**

**Components Implemented**:

- ✅ `VenueEvents` component - Collapsible section with client-side data fetching
- ✅ `EventCard` component - Compact event display with color-coded badges
- ✅ TypeScript interfaces in `/types/event.ts` (Event, EventSummary, EventType, EventStatus)
- ✅ Integration into `/app/venueDetails/[id]/page.tsx`

**Features**:

- Fetches events via `/api/events?venueId={venueId}`
- Filters for upcoming + recent past (30 days)
- Collapsible UI (collapsed by default, loads on expand)
- Color-coded event type badges (JAM_SESSION, GIG, CONCERT, etc.)
- Attendance tracking (shows X/Y attendees, "Full" indicator)
- Status badges (cancelled events marked clearly)
- Clickable cards navigate to `/events/[id]`
- Loading states, error handling, empty states
- Accessibility features (aria-expanded, aria-label)
- Dark mode support

**Key Files**:

- `components/venue/VenueEvents.tsx` - Main collapsible events container
- `components/venue/EventCard.tsx` - Individual event card component
- `types/event.ts` - Centralized event type definitions
- `app/venueDetails/[id]/page.tsx` - Venue detail page with events integration (line 414-416)

**Data Flow**:

1. User visits venue page → VenueEvents renders collapsed
2. User clicks expand → `useEffect` triggers `fetchEvents()`
3. API call to `/api/events?venueId={id}` returns all venue events
4. Client filters for events with `startDate >= 30 days ago`
5. Events sorted by date (earliest first)
6. EventCard components render with proper styling and badges

---

### Google Login & Profile Setup (In Progress)

**Implementation Plan**: See `.claude/plans/radiant-conjuring-peach.md` for full details

**Phase 1-2 Completed** (2024-11):

- ✅ Re-enabled Google social login (CSP fix resolved hanging issue)
- ✅ Fixed "Anonymous User" display (now shows `User {wallet_prefix}`)
- ✅ Created ProfileSetupBanner component for progressive onboarding
- ✅ Banner shows missing fields (displayName, username, email)

**Next Phases** (Pending):

- Phase 3: OAuth user creation with email capture
- Phase 4: Enhanced profile setup flow with email field
- Phase 5: Wallet upgrade flow (Google → MetaMask) with account merging
- Phase 6: Email-based user recognition across auth methods

**Key Files**:

- `context/ReownProvider.tsx` - Reown AppKit configuration
- `components/profile/ProfileSetupBanner.tsx` - Profile completion prompt
- `app/profile/[address]/page.tsx` - Profile display page
- `next.config.js` - CSP configuration (critical for OAuth)

  ## Current Sprint Information

  Current sprint documentation is located in:
  - `docs/sprints/SPRINT2_STATUS.md` - Current sprint status
  - `docs/sprints/SPRINT2_COMPLETION_ROADMAP.md` - Roadmap
  - Sprint planning and feature specs in `docs/sprints/`
