# Hybrid PostgreSQL + Celo Blockchain Architecture

This document explains the hybrid architecture implementation for the Piano Style Platform, which combines PostgreSQL for performance with Celo blockchain for trust and payments.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │    │ Celo Blockchain │
│                 │    │                 │    │                 │
│ • Fast UI       │◄──►│ • Fast queries  │◄──►│ • Verification  │
│ • Real-time     │    │ • Full-text     │    │ • Payments      │
│ • Progressive   │    │ • Analytics     │    │ • Immutable     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Benefits

### 🚀 Performance

- **Instant venue discovery**: PostgreSQL provides sub-100ms query responses
- **Advanced search**: Full-text search across venue names, descriptions, and tags
- **Complex filtering**: Geographic, amenity, and rating-based filters
- **Analytics**: Real-time venue performance tracking

### 🔒 Trust & Transparency

- **Blockchain verification**: All venues anchored on Celo blockchain
- **Immutable audit trail**: Complete history of venue submissions and verifications
- **Democratic verification**: Community-based venue approval system
- **Transparent payments**: All CAV transactions recorded on-chain

### 💳 Hybrid Payments

- **Web3 users**: Direct blockchain transactions with MetaMask/Valora
- **QR users**: QR code-based payments that settle on blockchain
- **Progressive enhancement**: Seamless experience regardless of user capabilities

## Database Schema

### Core Models

```typescript
// Venue model mirrors blockchain + enhanced PostgreSQL features
model Venue {
  // Blockchain mirrored fields
  blockchainId  Int?     @unique  // NULL until synced
  name          String
  city          String
  verified      Boolean
  submittedBy   String   // Wallet address

  // Enhanced PostgreSQL fields
  slug          String   @unique  // SEO-friendly URLs
  description   String?  // Rich descriptions
  latitude      Float?   // Geolocation
  longitude     Float?   // Geolocation
  searchVector  String?  // Full-text search
  tags          String[] // Searchable tags

  // Sync metadata
  syncStatus    SyncStatus
  lastSynced    DateTime?
}
```

## Data Flow

### 1. Venue Submission

```
User submits venue → PostgreSQL (immediate) → Sync Queue → Blockchain (async)
                  ↳ User gets instant feedback    ↳ Background process
```

### 2. Venue Discovery

```
User searches → PostgreSQL (instant results) → Display with sync status
```

### 3. Verification Process

```
Curator verifies → Blockchain transaction → PostgreSQL sync → Real-time updates
```

## API Endpoints

### Venues API

```typescript
// Get venues with advanced filtering
GET /api/venues
  ?city=San Francisco
  &hasPiano=true
  &search=jazz
  &orderBy=rating
  &limit=20

// Response includes sync status
{
  "venues": [...],
  "totalCount": 150,
  "syncStatus": {
    "stats": { "synced": 140, "pending": 10 }
  }
}
```

### Sync Management

```typescript
// Get sync status
GET /api/sync

// Trigger manual sync
POST /api/sync
{ "action": "trigger" }
```

## Implementation Examples

### 1. Fast Venue Loading (PostgreSQL)

```typescript
// app/venues/page.tsx
import { VenueService } from '@/lib/database'

const venues = await VenueService.getVenues({
  city: 'San Francisco',
  hasPiano: true,
  search: 'jazz',
  limit: 20,
})
// Returns in <100ms with full venue data
```

### 2. Blockchain Verification (Celo)

```typescript
// lib/blockchain-sync.ts
const syncService = new BlockchainSyncService()
await syncService.startSync()
// Syncs all venue data from blockchain
```

### 3. Hybrid Payments (Web3 + QR)

```typescript
// components/payments/UnifiedCAVPayment.tsx
<UnifiedCAVPayment
  paymentRequest={{
    recipientAddress: venue.paymentAddress,
    amount: "25"
  }}
  // Automatically detects user capabilities
  // Shows Web3 or QR interface accordingly
/>
```

## Sync Process

### Sync Queue System

```sql
-- Venues created locally are queued for blockchain sync
INSERT INTO SyncQueue (operation, entityType, entityId, payload)
VALUES ('CREATE', 'venue', 123, venue_data)
```

### Background Sync Job

```typescript
// Runs every 5 minutes
export async function runSyncJob() {
  await syncService.startSync()
  // 1. Sync from blockchain → PostgreSQL
  // 2. Process pending PostgreSQL → blockchain
  // 3. Update sync statuses
}
```

### Conflict Resolution

- **Blockchain is authoritative** for verification status and payments
- **PostgreSQL is authoritative** for enhanced metadata and analytics
- **Conflicts are flagged** for manual review

## Development Setup

### 1. Database Setup

```bash
# Install dependencies
yarn add prisma @prisma/client

# Set up database
yarn db:generate
yarn db:migrate
yarn db:seed
```

### 2. Environment Configuration

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/piano_blog"
NEXT_PUBLIC_CONTRACT_ADDRESS="0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2"
NEXT_PUBLIC_CAV_TOKEN_ADDRESS="0xe787A01BafC3276D0B3fEB93159F60dbB99b889F"
```

### 3. Running the Application

```bash
# Development with database
yarn dev

# View database
yarn db:studio

# Manual sync trigger
curl -X POST localhost:3000/api/sync -d '{"action":"trigger"}'
```

## Performance Metrics

### Before Hybrid Architecture

- Venue list load: **2-5 seconds** (blockchain calls)
- Search functionality: **Limited** (basic filtering only)
- User experience: **Poor** (wallet required for browsing)

### After Hybrid Architecture

- Venue list load: **<100ms** (PostgreSQL queries)
- Search functionality: **Advanced** (full-text, geolocation, complex filters)
- User experience: **Excellent** (progressive enhancement)

## Security Considerations

### Data Integrity

- **Blockchain as source of truth** for financial data
- **PostgreSQL mirrors blockchain** with additional metadata
- **Regular reconciliation** prevents data drift

### Access Control

- **Read operations**: Public (PostgreSQL)
- **Write operations**: Authenticated (blockchain verification required)
- **Admin operations**: Multi-signature wallet required

### Privacy

- **Personal data**: Stored off-chain in PostgreSQL
- **Financial data**: Transparent on blockchain
- **GDPR compliance**: User data can be deleted from PostgreSQL

## Monitoring & Observability

### Sync Health Dashboard

```typescript
const syncStatus = await getSyncStatus()
// Returns: { synced: 95%, pending: 3, failed: 2 }
```

### Performance Metrics

- Query response times (PostgreSQL)
- Blockchain sync lag
- Payment success rates
- User engagement analytics

## Future Enhancements

### Phase 2 (Planned)

- **Real-time sync**: WebSocket-based instant updates
- **Conflict resolution UI**: Admin dashboard for sync conflicts
- **Advanced analytics**: ML-powered venue recommendations
- **Mobile apps**: Native iOS/Android with offline sync

### Phase 3 (Future)

- **Multi-chain support**: Ethereum, Polygon integration
- **IPFS metadata**: Decentralized metadata storage
- **DAO governance**: Community-controlled platform evolution
- **NFT integration**: Venue ownership tokens

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and architecture decisions.
