# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Developing My Piano Style" - a Next.js blog application that combines traditional blogging with blockchain-based venue submission and discovery. The project is built on the Tailwind Next.js Starter Blog template and extended with Celo blockchain integration for a decentralized piano venue registry.

## Core Architecture

### Next.js App Structure (Next.js 15 + App Router)
- **App Router**: Uses Next.js App Router with TypeScript
- **Content Management**: Contentlayer2 handles MDX blog content with frontmatter processing
- **Styling**: Tailwind CSS 4.0 with custom themes and responsive design
- **State**: Client-side state management with React hooks

### Web3 Integration
- **Blockchain**: Celo Alfajores testnet integration
- **Contract Address**: VenueRegistry at `0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2`
- **Connection**: MetaMask wallet integration with automatic network switching
- **Libraries**: @celo/contractkit, @celo/react-celo, web3.js

### Key Features
1. **Blog System**: MDX-based blog with Contentlayer for content management
2. **Venue Registry**: Blockchain-based venue submission and verification system
3. **Web3 Wallet**: MetaMask integration with Celo network support
4. **Curator System**: Manual venue verification by authorized curators

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
- Handle network switching to Celo Alfajores (chainId: 0xaef3)  
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
- Content Security Policy configured in next.config.js
- Web3 interactions require user wallet approval
- No private keys stored in frontend code  
- IPFS hashes used for extended venue data storage