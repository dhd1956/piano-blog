# Music Upload & Playback User Stories

This document outlines user stories for implementing music upload and playback functionality in the "Developing My Piano Style" blog.

## Table of Contents

- [Core Features](#core-features)
- [User Roles](#user-roles)
- [Upload Stories](#upload-stories)
- [Playback Stories](#playback-stories)
- [Organization & Discovery](#organization--discovery)
- [Social & Community](#social--community)
- [Technical & Admin](#technical--admin)

---

## User Roles

- **Blog Owner**: Admin with full control over content and moderation
- **Contributor**: Musicians who can upload their own recordings
- **Visitor**: Anyone browsing the blog and listening to music
- **Curator**: Authorized users who can moderate/verify uploads

---

## Core Features

### Epic 1: Music Upload System

#### Story 1.1: Basic Audio Upload

**As a** contributor
**I want to** upload audio files of my piano performances
**So that** I can share my music with the community

**Acceptance Criteria:**

- Support common audio formats (MP3, WAV, M4A, FLAC)
- Maximum file size: 50MB per upload
- Progress indicator during upload
- Success/error messages after upload
- Preview uploaded audio before publishing

**Technical Notes:**

- Consider IPFS for decentralized storage
- Or use cloud storage (AWS S3, Cloudflare R2)
- Store metadata in PostgreSQL

---

#### Story 1.2: Music Metadata

**As a** contributor
**I want to** add details about my recording
**So that** listeners have context about the piece

**Acceptance Criteria:**

- Required fields: Title, Composer
- Optional fields: Style/Genre, Description, Recording Date, Location
- Connect to venues database (where was it recorded)
- Add tags for categorization
- Specify if it's an original composition or cover

**Database Schema:**

```sql
- title (required)
- composer (required)
- performer (wallet address)
- genre/style (jazz, classical, blues, etc.)
- description (text)
- recordingDate
- venueId (foreign key to venues table)
- tags (array)
- isOriginal (boolean)
- duration (seconds)
- fileUrl (IPFS or cloud storage URL)
- fileSize (bytes)
- format (mp3, wav, etc.)
```

---

#### Story 1.3: Wallet-Based Upload Authentication

**As a** contributor
**I want to** connect my wallet to upload music
**So that** my recordings are linked to my identity

**Acceptance Criteria:**

- MetaMask/Celo wallet connection required
- Each upload stores contributor's wallet address
- Contributors can view their upload history
- Wallet address displayed with recordings

---

### Epic 2: Music Playback

#### Story 2.1: Basic Audio Player

**As a** visitor
**I want to** play piano recordings on the site
**So that** I can enjoy the community's music

**Acceptance Criteria:**

- Embedded audio player on each recording
- Play/pause, volume control, seek bar
- Display current time and total duration
- Mobile-responsive player
- Keyboard shortcuts (spacebar for play/pause)

---

#### Story 2.2: Playlist Management

**As a** visitor
**I want to** create and save playlists
**So that** I can organize my favorite recordings

**Acceptance Criteria:**

- Add recordings to custom playlists
- Play entire playlist sequentially
- Shuffle and repeat options
- Save playlists to local storage or wallet
- Share playlist links

---

#### Story 2.3: Continuous Playback

**As a** visitor
**I want to** music to continue playing while browsing
**So that** I don't have to restart songs when changing pages

**Acceptance Criteria:**

- Persistent player that stays active across page navigation
- Mini player in corner/bottom of screen
- Shows current track info
- Expand to full player view

---

### Epic 3: Organization & Discovery

#### Story 3.1: Music Library Page

**As a** visitor
**I want to** browse all available recordings
**So that** I can discover new music

**Acceptance Criteria:**

- Grid or list view of all recordings
- Thumbnail/cover art for each track
- Filter by genre, composer, performer, venue
- Sort by date, popularity, duration
- Search by title, composer, tags
- Pagination for large libraries

---

#### Story 3.2: Featured Recordings

**As a** blog owner
**I want to** highlight exceptional recordings
**So that** great music gets more visibility

**Acceptance Criteria:**

- "Featured" flag on recordings
- Featured section on homepage
- Curator/admin can mark recordings as featured
- Featured recordings appear in special carousel

---

#### Story 3.3: Recording Collections

**As a** blog owner
**I want to** organize recordings into collections
**So that** related pieces are grouped together

**Acceptance Criteria:**

- Create themed collections (e.g., "Jazz Standards", "Chopin Nocturnes")
- Add multiple recordings to a collection
- Collection page with description and all tracks
- Auto-play entire collection

---

### Epic 4: Social & Community

#### Story 4.1: Recording Comments

**As a** visitor
**I want to** leave feedback on recordings
**So that** I can engage with performers

**Acceptance Criteria:**

- Comment section under each recording
- Wallet connection required to comment
- Timestamp-based comments (comment at specific time in track)
- Reply to comments
- Blog owner moderation tools

---

#### Story 4.2: Likes & Reactions

**As a** visitor
**I want to** like recordings I enjoy
**So that** I can show appreciation and help others discover good music

**Acceptance Criteria:**

- Heart/like button on each recording
- Like count displayed
- One like per wallet address
- "Most Liked" sorting option
- Contributor sees like notifications

---

#### Story 4.3: Recording Sharing

**As a** visitor
**I want to** share recordings with others
**So that** I can spread music I love

**Acceptance Criteria:**

- Share buttons (Twitter, Discord, direct link)
- Embeddable player for external sites
- QR code for mobile sharing
- Open Graph meta tags for rich previews

---

#### Story 4.4: Tip/Support Musicians

**As a** visitor
**I want to** send tips to performers I appreciate
**So that** I can support their work

**Acceptance Criteria:**

- Tip button on each recording
- Integration with existing PXP payment system
- Send CELO or PXP tokens
- Contributor's wallet address receives tips
- Transaction history

---

### Epic 5: Blog Integration

#### Story 5.1: Embed Music in Blog Posts

**As a** blog owner
**I want to** reference recordings in blog posts
**So that** I can illustrate piano technique discussions with audio examples

**Acceptance Criteria:**

- MDX component for embedding music player
- Syntax: `<MusicPlayer trackId="123" />`
- Inline player within blog content
- Autoplay option for demos
- Timestamp linking (start at specific moment)

**Example Usage:**

```mdx
Here's an example of the stride piano technique:

<MusicPlayer trackId="42" startTime="35" title="Fats Waller - Ain't Misbehavin'" />
```

---

#### Story 5.2: Recording-Linked Blog Posts

**As a** blog owner
**I want to** write blog posts about specific recordings
**So that** I can provide detailed analysis and context

**Acceptance Criteria:**

- Link blog post to recording
- "Related Blog Post" section on recording page
- "Listen to Recording" CTA in blog post
- Bidirectional navigation

---

### Epic 6: Blockchain Proof of Creation

#### Story 6.1: Optional Blockchain Registration

**As a** contributor
**I want to** register my recording on the blockchain
**So that** I have immutable proof I created it first

**Acceptance Criteria:**

- Upload flow includes optional "Register on Blockchain" step
- System calculates SHA-256 hash of audio file
- User signs transaction with MetaMask/Celo wallet
- Transaction stores: hash, title, composer, performer address, timestamp
- User pays gas fee (~$0.001 on Celo)
- Success confirmation with transaction hash
- Badge shows "⛓️ Blockchain Verified" on recording

**Technical Notes:**

- Deploy separate RecordingRegistry smart contract
- Hash calculated server-side after upload
- User decides whether to register (not required)
- Database stores: blockchainTxHash, registeredAt, blockchainRegistered flag

---

#### Story 6.2: Blockchain Verification Display

**As a** visitor
**I want to** see if a recording is blockchain-verified
**So that** I can trust its authenticity and timestamp

**Acceptance Criteria:**

- Verified recordings show "⛓️ Blockchain Verified" badge
- Click badge to see: transaction hash, registration timestamp, performer wallet
- Link to Celo block explorer to view transaction
- "Verify Authenticity" button re-hashes file and compares with chain
- Timeline view: Upload date → Blockchain registration → Curator approval

---

#### Story 6.3: Recording Hash Generation

**As the** system
**I want to** generate cryptographic hash of audio files
**So that** blockchain verification is possible

**Acceptance Criteria:**

- Calculate SHA-256 hash after file upload
- Display hash to user before blockchain registration
- Store hash in database (even if not registered on-chain)
- Verification function can re-hash file and compare

---

#### Story 6.4: RecordingRegistry Smart Contract

**As the** system
**I want to** maintain on-chain registry of recordings
**So that** proof of creation is immutable

**Contract Functions:**

```solidity
registerRecording(
    bytes32 audioHash,
    string title,
    string composer,
    uint256 venueId,
    string ipfsHash  // reserved for future
) returns (uint256 recordingId)

verifyRecording(
    uint256 recordingId,
    bytes32 audioHash
) returns (bool)

getRecording(uint256 recordingId)
    returns (Recording struct)
```

**Events:**

- RecordingRegistered(recordingId, audioHash, performer, title, timestamp)

**Storage:**

- Mapping: recordingId => Recording struct
- Recording struct: audioHash, title, composer, performer, timestamp, venueId, ipfsHash

---

### Epic 7: Technical & Admin

#### Story 7.1: Recording Moderation

**As a** blog owner/curator
**I want to** review uploads before they're published
**So that** I can ensure quality and appropriate content

**Acceptance Criteria:**

- Uploads start in "pending" state
- Curator dashboard shows pending recordings
- Approve/reject actions with notes
- Email/notification to contributor on status change
- Rejected recordings include feedback

---

#### Story 7.2: Audio Processing

**As the** system
**I want to** automatically process uploaded audio
**So that** playback is optimized

**Acceptance Criteria:**

- Convert to standard format (MP3 320kbps)
- Generate waveform visualization
- Extract duration, bitrate metadata
- Create compressed preview version
- Generate thumbnail/cover art if not provided

---

#### Story 7.3: Storage Management

**As a** blog owner
**I want to** monitor storage usage
**So that** I can manage costs and capacity

**Acceptance Criteria:**

- Dashboard showing total storage used
- Per-user storage limits
- Option to delete old/unpopular recordings
- Archive feature for seasonal content
- Storage cost estimates

---

#### Story 7.4: Recording Analytics

**As a** contributor
**I want to** see stats on my recordings
**So that** I understand what resonates with listeners

**Acceptance Criteria:**

- Play count per recording
- Unique listeners count
- Average listen duration (did they finish?)
- Geographic data (if available)
- Likes and comments count
- Trending recordings dashboard

---

## Implementation Phases

### Phase 1: MVP (Minimum Viable Product - No Blockchain)

**Goal**: Get basic music upload/playback working with local storage

- [ ] Story 1.1: Basic Audio Upload (local `/public/audio/` storage)
- [ ] Story 1.2: Music Metadata
- [ ] Story 1.3: Wallet-Based Authentication
- [ ] Story 2.1: Basic Audio Player
- [ ] Story 3.1: Music Library Page
- [ ] Story 7.1: Recording Moderation (extend curator system)
- [ ] Story 6.3: Recording Hash Generation (prepare for blockchain)

**Timeline**: 2-3 weeks
**Cost**: $0 (local storage, no blockchain yet)

### Phase 2: Blockchain Integration

**Goal**: Add optional blockchain proof of creation

- [ ] Story 6.1: Optional Blockchain Registration
- [ ] Story 6.2: Blockchain Verification Display
- [ ] Story 6.4: Deploy RecordingRegistry Smart Contract
- [ ] Test on Celo Alfajores testnet
- [ ] Deploy to Celo Mainnet

**Timeline**: 1-2 weeks
**Cost**: ~$0.001 per registration (user pays)

### Phase 3: Community Features

**Goal**: Engagement and social features

- [ ] Story 4.1: Recording Comments
- [ ] Story 4.2: Likes & Reactions
- [ ] Story 4.4: Tip/Support Musicians (reuse existing PXP system)
- [ ] Story 5.1: Embed Music in Blog Posts
- [ ] Profile integration: show user's recordings

**Timeline**: 2-3 weeks

### Phase 4: Enhanced Features

**Goal**: Playlists, analytics, and polish

- [ ] Story 2.2: Playlist Management
- [ ] Story 2.3: Continuous Playback
- [ ] Story 3.2: Featured Recordings
- [ ] Story 3.3: Recording Collections
- [ ] Story 4.3: Recording Sharing
- [ ] Story 7.2: Audio Processing (waveforms, conversion)
- [ ] Story 7.4: Recording Analytics

**Timeline**: 2-3 weeks

### Phase 5: Future / Monetization

**Goal**: Premium features and revenue

- [ ] IPFS upload as paid premium ($2/recording)
- [ ] Story 5.2: Recording-Linked Blog Posts
- [ ] Story 7.3: Storage Management dashboard
- [ ] Download high-quality versions (FLAC, WAV)
- [ ] Premium membership tiers
- [ ] NFT minting of special recordings

**Timeline**: TBD (when making revenue)

---

## Technical Architecture Considerations

### ✅ Storage Decision: Local Files (RESOLVED)

**Chosen Approach**: Local file storage in `/public/audio/recordings/`

**Rationale:**

- **Cost**: $0 (no external services)
- **Speed**: Fast playback from local server
- **Simplicity**: No external APIs or complexity
- **Scalability**: Good for 50-100 recordings initially
- **Future-proof**: Can migrate to cloud/IPFS later if needed

**Implementation:**

- Store files in `/public/audio/recordings/{uuid}.{ext}`
- Serve via Next.js static file serving
- Calculate SHA-256 hash for blockchain verification
- Database stores: filePath, fileSize, duration, format, audioHash

### Storage Options Comparison (For Future Reference)

1. **✅ Local Storage (CURRENT)**
   - Pros: Free, fast, simple, works like images
   - Cons: Limited scalability, server-dependent
   - Cost: $0
   - Best for: MVP, testing, <100 recordings

2. **IPFS (Future Premium Feature)**
   - Pros: Decentralized, censorship-resistant, Web3-native
   - Cons: Slower retrieval, requires pinning service, costs money
   - Cost: Pinning service ~$5-20/month for 100GB
   - Implementation: Phase 5 - Offer as $2/recording premium upgrade

3. **Cloudflare R2 (Future Migration Option)**
   - Pros: Fast CDN, no egress fees, scalable
   - Cons: Centralized, costs money
   - Cost: $0.015/GB storage + $0.36/million reads (free tier: 10GB)
   - Best for: If local storage hits limits (100+ recordings)

4. **AWS S3 (Not Recommended)**
   - Pros: Reliable, feature-rich
   - Cons: Egress costs, more expensive than R2
   - Cost: $0.023/GB + bandwidth fees

### ✅ Blockchain Integration (RESOLVED)

**Chosen Approach**: Optional blockchain registration with user-paid gas

**Implementation:**

- Separate `RecordingRegistry` smart contract on Celo
- Store SHA-256 hash, not full file (too expensive)
- User chooses whether to register after upload
- User signs transaction and pays gas (~$0.001 on Celo)
- Database tracks: blockchainTxHash, registeredAt, blockchainRegistered

**Benefits:**

- Immutable proof of creation with timestamp
- Authenticity verification (re-hash and compare)
- Performer attribution (wallet address)
- Copyright protection evidence

**Why Optional:**

- Not all recordings need blockchain proof
- Keeps barrier to entry low (free to upload)
- User pays only if they want immutability
- Still get full functionality without blockchain

### Database Schema Additions

```sql
CREATE TABLE recordings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  composer VARCHAR(255) NOT NULL,
  performer_address VARCHAR(42) NOT NULL,
  genre VARCHAR(100),
  description TEXT,
  recording_date DATE,
  venue_id INTEGER REFERENCES venues(id),
  tags TEXT[],
  is_original BOOLEAN DEFAULT false,

  -- File details (local storage)
  file_path TEXT NOT NULL,              -- /audio/recordings/uuid.mp3
  file_size INTEGER NOT NULL,           -- bytes
  format VARCHAR(10) NOT NULL,          -- mp3, wav, m4a
  duration INTEGER NOT NULL,            -- seconds

  -- Blockchain proof (OPTIONAL)
  audio_hash VARCHAR(66),               -- SHA-256 hash (0x...)
  blockchain_tx_hash VARCHAR(66),       -- Celo transaction hash
  blockchain_registered BOOLEAN DEFAULT false,
  registered_at TIMESTAMP,              -- When registered on-chain
  ipfs_hash TEXT,                       -- Reserved for future premium feature

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, published, rejected
  verified BOOLEAN DEFAULT false,       -- curator approved
  featured BOOLEAN DEFAULT false,

  -- Metadata
  waveform_data JSONB,
  cover_image_url TEXT,

  -- Stats
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE TABLE recording_likes (
  id SERIAL PRIMARY KEY,
  recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(recording_id, wallet_address)
);

CREATE TABLE recording_plays (
  id SERIAL PRIMARY KEY,
  recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42),
  session_id VARCHAR(255),
  listen_duration INTEGER, -- seconds listened
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_address VARCHAR(42) NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE playlist_recordings (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

```
POST   /api/recordings              - Upload new recording
GET    /api/recordings              - List all recordings (with filters)
GET    /api/recordings/:id          - Get single recording
PUT    /api/recordings/:id          - Update recording metadata
DELETE /api/recordings/:id          - Delete recording (owner/admin only)

POST   /api/recordings/:id/like     - Like a recording
DELETE /api/recordings/:id/like     - Unlike a recording
POST   /api/recordings/:id/play     - Track a play/listen

GET    /api/playlists               - List user's playlists
POST   /api/playlists               - Create playlist
PUT    /api/playlists/:id           - Update playlist
DELETE /api/playlists/:id           - Delete playlist
POST   /api/playlists/:id/add       - Add recording to playlist

GET    /api/curator/recordings      - List pending recordings
POST   /api/curator/recordings/:id/approve - Approve recording
POST   /api/curator/recordings/:id/reject  - Reject recording
```

---

## UI/UX Considerations

### Player Design

- Waveform visualization (like SoundCloud)
- Minimalist controls for clean look
- Color scheme matching blog theme
- Dark mode support

### Mobile Experience

- Touch-friendly player controls
- Swipe gestures for next/previous track
- Offline mode with cached favorites
- Background playback support

### Accessibility

- Keyboard navigation
- Screen reader support
- Caption support for spoken introductions
- High contrast mode

---

## Success Metrics

### Engagement

- Average plays per recording
- Completion rate (% who listen to end)
- Like-to-play ratio
- Comment engagement

### Growth

- New recordings per week
- Unique contributors
- Returning listeners
- Playlist creation rate

### Quality

- Average rating/likes per recording
- Featured recording frequency
- Moderation approval rate

---

## Future Enhancements

- **Live Streaming**: Real-time piano performances
- **Collaborative Recordings**: Multi-track uploads
- **Sheet Music Integration**: Attach PDF scores to recordings
- **Practice Tools**: Loop sections, slow down playback
- **Recording Competitions**: Community voting on themes
- **NFT Recordings**: Mint special recordings as NFTs
- **Subscription Tiers**: Premium features for supporters
- **Mobile App**: Native iOS/Android apps

---

## Technical Decisions Summary

### ✅ Resolved Decisions

1. **Storage**: ✅ Local files in `/public/audio/` (free, fast, simple)
2. **Blockchain**: ✅ Optional registration, new RecordingRegistry contract, user pays gas
3. **IPFS**: ✅ Skip for MVP, add later as $2/recording premium feature
4. **Contract Architecture**: ✅ Separate RecordingRegistry (not extending VenueRegistry)
5. **Gas Fees**: ✅ User pays (~$0.001 on Celo)
6. **Moderation**: ✅ Pre-approval (curator reviews before publishing)

### 💰 Cost Structure

- **Phase 1 (MVP)**: $0 total
  - Local storage: Free
  - No blockchain yet

- **Phase 2 (Blockchain)**: $0 ongoing
  - User pays gas per registration (~$0.001)
  - Smart contract deployment: One-time ~$0.50

- **Phase 5 (Premium)**: Revenue-generating
  - IPFS uploads: $2/recording (covers pinning + profit)
  - Premium tiers: $5-10/month
  - Featured placements: Pay to promote

### ❓ Open Questions (To Resolve Later)

1. **Copyright**: How to handle copyrighted material? (Moderator review + DMCA policy)
2. **Licensing**: Creative Commons or custom license? (Let uploader choose)
3. **Quality Standards**: Minimum audio quality requirements? (320kbps MP3 minimum)
4. **Storage Limits**: Per-user upload limits? (Start unlimited, add limits if abused)
5. **Monetization Timeline**: When to introduce premium features? (After 50+ recordings)

---

_Document created: 2025-10-09_
_Last updated: 2025-10-12_

## Change Log

**2025-10-12**: Major update

- Added Epic 6: Blockchain Proof of Creation (4 new stories)
- Documented storage decision: Local files (not IPFS/cloud)
- Documented blockchain approach: Optional, user-paid gas
- Updated implementation phases to reflect priorities
- Added Technical Decisions Summary section
- Clarified cost structure ($0 for MVP)
- Reserved IPFS as future premium feature
