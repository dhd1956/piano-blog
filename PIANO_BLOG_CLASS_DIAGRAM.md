# 🎹 Piano Style Platform - Class Diagram

## System Architecture Overview

The Piano Style Platform uses a **simplified hybrid architecture** where:

- **PostgreSQL**: Handles all venue data, user profiles, reviews, analytics
- **Blockchain (Celo)**: Only handles PXP token transactions and rewards
- **Performance**: 10-50x improvement with <100ms venue loading

```mermaid
classDiagram
    %% ===================
    %% DATA MODELS (Prisma)
    %% ===================

    class Venue {
        +int id
        +string slug
        +string name
        +string city
        +string contactInfo
        +string contactType
        +string submittedBy
        +boolean hasPiano
        +boolean hasJamSession
        +int venueType
        +string description
        +string address
        +float latitude
        +float longitude
        +string phone
        +string website
        +json socialLinks
        +string[] amenities
        +string[] tags
        +string priceRange
        +float rating
        +int reviewCount
        +boolean verified
        +datetime verifiedAt
        +string venueHash
        +datetime createdAt
        +datetime updatedAt

        +VenueReview[] reviews
        +VenueVerification[] verifications
        +VenueAnalytics[] analytics
    }

    class User {
        +int id
        +string walletAddress
        +string username
        +string displayName
        +string email
        +string bio
        +string avatar
        +string location
        +string ensName
        +string profileNFT
        +float totalCAVEarned
        +boolean hasClaimedNewUserReward
        +boolean isAuthorizedVerifier
        +datetime createdAt
        +datetime updatedAt
        +datetime lastActive

        +VenueReview[] reviews
    }

    class VenueReview {
        +int id
        +int venueId
        +int userId
        +int rating
        +string title
        +string content
        +int pianoQuality
        +boolean isVerified
        +boolean isHidden
        +datetime createdAt
        +datetime updatedAt

        +Venue venue
        +User user
    }

    class VenueVerification {
        +int id
        +int venueId
        +string verifierAddress
        +boolean approved
        +string notes
        +int rating
        +datetime timestamp
        +string transactionHash
        +int blockNumber

        +Venue venue
    }

    class CAVPayment {
        +int id
        +string fromAddress
        +string toAddress
        +int venueId
        +float amount
        +string transactionHash
        +int blockNumber
        +datetime blockTimestamp
        +PaymentStatus status
        +string paymentType
        +string memo
        +string paymentMethod
        +datetime createdAt
    }

    class VenueAnalytics {
        +int id
        +int venueId
        +date date
        +int views
        +int uniqueViews
        +int qrScans
        +int detailViews
        +int shareClicks
        +int searchImpressions
        +int searchClicks

        +Venue venue
    }

    class AppConfig {
        +int id
        +string key
        +json value
        +string description
        +datetime updatedAt
    }

    class BlockchainEvent {
        +int id
        +string eventType
        +string contractAddress
        +string transactionHash
        +int blockNumber
        +datetime blockTimestamp
        +json eventData
        +boolean processed
        +datetime processedAt
        +datetime createdAt
    }

    %% ===================
    %% SERVICE CLASSES
    %% ===================

    class VenueService {
        +getVenues(options) Promise~VenueList~
        +getVenue(identifier) Promise~Venue~
        +createVenue(data) Promise~Venue~
        +markVenueAsVerified(hash, txHash) Promise~UpdateResult~
        +getVenuesByCity(city, options) Promise~Venue[]~
    }

    class UserService {
        +findOrCreateUser(walletAddress, initialData) Promise~User~
        +updateUserBlockchainCache(walletAddress, updates) Promise~User~
    }

    class AnalyticsService {
        +trackVenueView(venueId, isUnique) Promise~void~
        +trackQRScan(venueId) Promise~void~
        +trackVenueDetailView(venueId) Promise~void~
    }

    class BlockchainEventService {
        +recordEvent(eventData) Promise~BlockchainEvent~
        +processPendingEvents() Promise~void~
        +processEvent(event) Promise~void~
    }

    %% ===================
    %% WEB3 & CONTRACT CLASSES
    %% ===================

    class CAVRewardsService {
        +string contractAddress
        +Web3 web3
        +Contract contract

        +claimNewUserReward() Promise~TransactionReceipt~
        +rewardScout(scout, amount) Promise~TransactionReceipt~
        +rewardVerifier(verifier, amount) Promise~TransactionReceipt~
        +hasClaimedNewUserReward(address) Promise~boolean~
        +isAuthorizedVerifier(address) Promise~boolean~
        +generateVenueHash(name, city, scout) Promise~string~
        +trackPayment(from, to, amount, memo) Promise~TransactionReceipt~
    }

    class Web3Provider {
        +boolean isConnected
        +string account
        +Web3 web3
        +string networkId

        +connect() Promise~string~
        +disconnect() Promise~void~
        +switchToTestnet() Promise~void~
        +getAccount() string
        +getBalance() Promise~string~
    }

    %% ===================
    %% API CONTROLLERS
    %% ===================

    class VenuesAPIController {
        +GET(request) Promise~NextResponse~
        +POST(request) Promise~NextResponse~
    }

    class VenueAPIController {
        +GET(request, params) Promise~NextResponse~
        +PUT(request, params) Promise~NextResponse~
        +DELETE(request, params) Promise~NextResponse~
    }

    class SyncAPIController {
        +GET(request) Promise~NextResponse~
        +POST(request) Promise~NextResponse~
    }

    %% ===================
    %% REACT COMPONENTS
    %% ===================

    class VenueCard {
        +Venue venue
        +boolean showActions

        +render() JSX.Element
        +handleVenueClick() void
        +handlePaymentClick() void
    }

    class VenueDetailsView {
        +Venue venue
        +User currentUser

        +render() JSX.Element
        +handleReviewSubmit() void
        +handleVerification() void
    }

    class UnifiedCAVPayment {
        +string venueId
        +string amount
        +PaymentMethod method

        +render() JSX.Element
        +handleWeb3Payment() Promise~void~
        +handleQRPayment() Promise~void~
    }

    class WalletConnection {
        +boolean isConnected
        +string account

        +render() JSX.Element
        +handleConnect() Promise~void~
        +handleDisconnect() void
    }

    class QRCodeGenerator {
        +string data
        +QRCodeOptions options

        +render() JSX.Element
        +generateQR() void
    }

    class QRCodeScanner {
        +function onScan
        +boolean isActive

        +render() JSX.Element
        +startScanning() void
        +stopScanning() void
    }

    %% ===================
    %% UTILITY CLASSES
    %% ===================

    class IPFSService {
        +uploadToIPFS(data) Promise~string~
        +getFromIPFS(hash) Promise~any~
    }

    class PermissionsService {
        +canEditVenue(user, venue) boolean
        +canVerifyVenue(user) boolean
        +canModerateReviews(user) boolean
    }

    class RPCErrorHandler {
        +handleError(error) void
        +isNetworkError(error) boolean
        +shouldRetry(error) boolean
    }

    %% ===================
    %% ENUMS
    %% ===================

    class PaymentStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        FAILED
    }

    class VenueType {
        <<enumeration>>
        CAFE
        RESTAURANT
        BAR
        CLUB
        COMMUNITY_CENTER
        HOTEL
        LIBRARY
        SCHOOL
        OTHER
    }

    class PaymentMethod {
        <<enumeration>>
        WEB3
        QR_CODE
    }

    %% ===================
    %% RELATIONSHIPS
    %% ===================

    %% Data Model Relationships
    Venue ||--o{ VenueReview : "has reviews"
    Venue ||--o{ VenueVerification : "has verifications"
    Venue ||--o{ VenueAnalytics : "has analytics"
    User ||--o{ VenueReview : "writes reviews"
    CAVPayment ||--o| Venue : "references venue"

    %% Service Dependencies
    VenueService --> Venue : "manages"
    VenueService --> CAVRewardsService : "uses for hashing"
    UserService --> User : "manages"
    UserService --> CAVRewardsService : "syncs blockchain data"
    AnalyticsService --> VenueAnalytics : "tracks"
    BlockchainEventService --> BlockchainEvent : "processes"
    BlockchainEventService --> VenueService : "updates venues"
    BlockchainEventService --> UserService : "updates users"

    %% API Controller Dependencies
    VenuesAPIController --> VenueService : "uses"
    VenuesAPIController --> AnalyticsService : "tracks views"
    VenueAPIController --> VenueService : "uses"
    SyncAPIController --> BlockchainEventService : "triggers"

    %% Component Dependencies
    VenueCard --> Venue : "displays"
    VenueCard --> UnifiedCAVPayment : "contains"
    VenueDetailsView --> Venue : "displays"
    VenueDetailsView --> VenueReview : "shows reviews"
    VenueDetailsView --> VenueVerification : "shows verifications"
    UnifiedCAVPayment --> CAVRewardsService : "processes payments"
    UnifiedCAVPayment --> QRCodeGenerator : "generates QR"
    WalletConnection --> Web3Provider : "manages connection"

    %% Web3 Dependencies
    CAVRewardsService --> Web3Provider : "uses web3"
    Web3Provider --> PaymentMethod : "supports methods"

    %% Utility Dependencies
    CAVRewardsService --> IPFSService : "stores metadata"
    VenueAPIController --> PermissionsService : "checks permissions"
    Web3Provider --> RPCErrorHandler : "handles errors"

    %% Enum Usage
    CAVPayment --> PaymentStatus : "has status"
    Venue --> VenueType : "has type"
    UnifiedCAVPayment --> PaymentMethod : "uses method"

    %% ===================
    %% STYLING
    %% ===================

    classDef dataModel fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef web3 fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef api fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef component fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef utility fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef enum fill:#fff8e1,stroke:#f57f17,stroke-width:2px

    class Venue,User,VenueReview,VenueVerification,CAVPayment,VenueAnalytics,AppConfig,BlockchainEvent dataModel
    class VenueService,UserService,AnalyticsService,BlockchainEventService service
    class CAVRewardsService,Web3Provider web3
    class VenuesAPIController,VenueAPIController,SyncAPIController api
    class VenueCard,VenueDetailsView,UnifiedCAVPayment,WalletConnection,QRCodeGenerator,QRCodeScanner component
    class IPFSService,PermissionsService,RPCErrorHandler utility
    class PaymentStatus,VenueType,PaymentMethod enum
```

## Key Architecture Patterns

### 1. **Simplified Hybrid Architecture**

- **PostgreSQL**: Primary data store for all venue content, user profiles, reviews
- **Blockchain**: Only for PXP token transactions and reward distribution
- **Event-driven sync**: Blockchain events update PostgreSQL cache

### 2. **Service Layer Pattern**

- `VenueService`: CRUD operations for venues
- `UserService`: User management with blockchain cache
- `AnalyticsService`: Performance tracking
- `BlockchainEventService`: Event processing pipeline

### 3. **Progressive Enhancement**

- Core functionality works without Web3 connection
- Enhanced features available with wallet connection
- Graceful degradation for non-crypto users

### 4. **Performance Optimization**

- PostgreSQL indexes for fast queries (<100ms)
- Cached blockchain data in database
- Efficient pagination and filtering
- Background event processing

### 5. **Component Architecture**

- Reusable React components for venue display
- Unified payment component supporting Web3 + QR codes
- Modular Web3 provider with error handling
- Responsive design with Tailwind CSS

This architecture achieves **10-50x performance improvement** over complex blockchain-first approaches while maintaining transparency and decentralization benefits for financial transactions.
