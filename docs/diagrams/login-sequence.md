# Login Process - Sequence Diagrams

This document provides sequence diagrams for the various authentication flows in the Piano Blog application.

## Overview

The Piano Blog supports three primary authentication methods:

1. **Web3 Wallet** (MetaMask) - Blockchain wallet connection
2. **Google OAuth** - Social login via Reown AppKit
3. **Email Login** - Email-based authentication via Reown AppKit

All methods integrate with the role-based permission system (RBAC) to determine user capabilities.

---

## 1. MetaMask Wallet Connection Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React Component
    participant Web3Provider as WorkingWeb3Provider
    participant MetaMask as MetaMask Wallet
    participant PermAPI as /api/auth/permissions
    participant Database as PostgreSQL

    User->>UI: Click "Connect Wallet"
    UI->>Web3Provider: connect()
    Web3Provider->>MetaMask: eth_requestAccounts

    alt User Approves
        MetaMask-->>Web3Provider: accounts[0] (wallet address)
        Web3Provider->>MetaMask: eth_chainId
        MetaMask-->>Web3Provider: chainId

        alt Wrong Network
            Web3Provider->>MetaMask: wallet_switchEthereumChain (Celo Sepolia)
            MetaMask-->>Web3Provider: Success/Error

            alt Network Not Added
                Web3Provider->>MetaMask: wallet_addEthereumChain
                MetaMask-->>Web3Provider: Network added
            end
        end

        Web3Provider->>PermAPI: GET /api/auth/permissions?address={walletAddress}
        PermAPI->>Database: findUnique({ walletAddress })

        alt User Exists
            Database-->>PermAPI: User data with role
            PermAPI-->>Web3Provider: { role, isBlogOwner, isCurator, canAccessCurator, ... }
        else User Not Found
            Database-->>PermAPI: null
            PermAPI-->>Web3Provider: { role: SCOUT, isBlogOwner: false, ... }
        end

        Web3Provider->>Web3Provider: updateState({ isConnected: true, role, permissions })
        Web3Provider-->>UI: Connection successful
        UI-->>User: Show connected state with role

    else User Rejects
        MetaMask-->>Web3Provider: User rejected
        Web3Provider->>Web3Provider: updateState({ status: 'error' })
        Web3Provider-->>UI: Connection failed
        UI-->>User: Show error message
    end
```

---

## 2. Google OAuth Login Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React Component
    participant ReownKit as Reown AppKit
    participant Google as Google OAuth
    participant Backend as Next.js API
    participant Database as PostgreSQL
    participant PermAPI as /api/auth/permissions

    User->>UI: Click "Login with Google"
    UI->>ReownKit: openModal()
    ReownKit->>ReownKit: Show login options
    User->>ReownKit: Select "Google"

    ReownKit->>Google: OAuth authorization request
    Google-->>User: Show Google consent screen
    User->>Google: Approve access

    Google-->>ReownKit: OAuth token + user info (email, name)
    ReownKit->>Backend: Create/verify session
    Backend->>Database: findOrCreate user by email

    alt User Exists
        Database-->>Backend: Existing user record
    else New User
        Database->>Database: Create user { email, displayName, role: SCOUT }
        Database-->>Backend: New user record
    end

    Backend-->>ReownKit: Session established
    ReownKit->>ReownKit: Generate temporary wallet address

    ReownKit->>PermAPI: GET /api/auth/permissions?address={tempAddress}
    PermAPI->>Database: findUnique({ walletAddress: tempAddress })
    Database-->>PermAPI: User data with role
    PermAPI-->>ReownKit: { role, permissions }

    ReownKit-->>UI: Login successful
    UI->>UI: Update auth state
    UI-->>User: Show logged-in state
```

---

## 3. Email Login Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React Component
    participant ReownKit as Reown AppKit
    participant EmailService as Email Service (Reown)
    participant Backend as Next.js API
    participant Database as PostgreSQL
    participant PermAPI as /api/auth/permissions

    User->>UI: Click "Login with Email"
    UI->>ReownKit: openModal()
    ReownKit->>ReownKit: Show email input
    User->>ReownKit: Enter email address

    ReownKit->>EmailService: Send magic link to email
    EmailService-->>User: Email with login link
    User->>EmailService: Click magic link

    EmailService->>Backend: Verify magic link token
    Backend->>Backend: Validate token signature
    Backend->>Database: findOrCreate user by email

    alt User Exists
        Database-->>Backend: Existing user record
    else New User
        Database->>Database: Create user { email, role: SCOUT }
        Database-->>Backend: New user record
    end

    Backend-->>ReownKit: Session token
    ReownKit->>ReownKit: Store session + generate wallet

    ReownKit->>PermAPI: GET /api/auth/permissions?address={address}
    PermAPI->>Database: findUnique({ walletAddress })
    Database-->>PermAPI: User data with role
    PermAPI-->>ReownKit: { role, permissions }

    ReownKit-->>UI: Login successful
    UI-->>User: Show logged-in state
```

---

## 4. Permission Resolution Flow

This flow occurs after any successful authentication method.

```mermaid
sequenceDiagram
    participant Web3Provider
    participant PermAPI as /api/auth/permissions
    participant Database as PostgreSQL
    participant UI as React Components

    Web3Provider->>PermAPI: GET /api/auth/permissions?address={walletAddress}

    PermAPI->>Database: prisma.user.findUnique({ walletAddress })

    alt User Found in Database
        Database-->>PermAPI: User { id, role, username, ... }

        PermAPI->>PermAPI: Calculate permissions from role
        Note over PermAPI: role === BLOG_OWNER<br/>→ All permissions<br/><br/>role === CURATOR<br/>→ Can create events, edit venues<br/><br/>role === VALIDATOR<br/>→ Can validate venues<br/><br/>role === SCOUT<br/>→ Basic permissions

        PermAPI-->>Web3Provider: {<br/>  role: user.role,<br/>  isBlogOwner: role === BLOG_OWNER,<br/>  isCurator: role === CURATOR || BLOG_OWNER,<br/>  isValidator: role === VALIDATOR || BLOG_OWNER,<br/>  canAccessCurator: isCurator,<br/>  canAccessValidator: isValidator,<br/>  canAccessAdmin: isBlogOwner<br/>}
    else User Not Found
        Database-->>PermAPI: null
        PermAPI-->>Web3Provider: {<br/>  role: SCOUT,<br/>  isBlogOwner: false,<br/>  isCurator: false,<br/>  isValidator: false,<br/>  canAccessCurator: false,<br/>  canAccessValidator: false,<br/>  canAccessAdmin: false<br/>}
    end

    Web3Provider->>Web3Provider: updateState({ role, permissions })
    Web3Provider->>UI: Trigger re-render with new permissions

    UI->>UI: useRole() / usePermissions()
    Note over UI: Components check permissions:<br/>- canCreateEvent()<br/>- canEditVenue()<br/>- canAccessCurator<br/>- etc.

    UI-->>Web3Provider: Render UI based on role
```

---

## 5. Role-Based Access Control (RBAC) Check Flow

This flow shows how protected pages/features check user permissions.

```mermaid
sequenceDiagram
    participant User
    participant Page as Protected Page/Feature
    participant useRole as useRole() Hook
    participant Web3Provider
    participant PermAPI as /api/auth/permissions

    User->>Page: Navigate to /events/create
    Page->>useRole: const { role, canCreateEvent } = useRole()
    useRole->>Web3Provider: Get cached permissions

    alt Permissions Cached
        Web3Provider-->>useRole: { role, canCreateEvent, ... }
    else Permissions Not Loaded
        Web3Provider->>PermAPI: Fetch permissions
        PermAPI-->>Web3Provider: { role, permissions }
        Web3Provider-->>useRole: { role, canCreateEvent, ... }
    end

    useRole-->>Page: { role: SCOUT, canCreateEvent: () => false }

    Page->>Page: Check canCreateEvent()

    alt Has Permission (CURATOR or BLOG_OWNER)
        Page-->>User: Show event creation form
    else No Permission (SCOUT or VALIDATOR)
        Page-->>User: Show permission error:<br/>"Only curators and blog owners can create events.<br/>Your current role is: SCOUT"
    end
```

---

## 6. API Authorization Flow (Protected Endpoints)

Example: Creating an event (requires CURATOR or BLOG_OWNER role)

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as /api/events (POST)
    participant Middleware as requireRole()
    participant Database as PostgreSQL

    Client->>API: POST /api/events<br/>Headers: { x-wallet-address }

    API->>Middleware: requireRole([CURATOR, BLOG_OWNER])
    Middleware->>Middleware: Extract x-wallet-address from headers

    Middleware->>Database: prisma.user.findUnique({ walletAddress })

    alt User Found
        Database-->>Middleware: User { role: SCOUT }

        Middleware->>Middleware: Check if role in [CURATOR, BLOG_OWNER]

        alt Role Authorized
            Middleware-->>API: { authorized: true, user }
            API->>API: Process event creation
            API->>Database: prisma.event.create({ ... })
            Database-->>API: Created event
            API-->>Client: 201 Created { event }
        else Role Not Authorized
            Middleware-->>API: { authorized: false }
            API-->>Client: 403 Forbidden<br/>{ error: "Only curators and blog owners can create events" }
        end

    else User Not Found
        Database-->>Middleware: null
        Middleware-->>API: { authorized: false }
        API-->>Client: 403 Forbidden<br/>{ error: "User not found" }
    end
```

---

## 7. Auto-Connect Flow (Returning Users)

```mermaid
sequenceDiagram
    participant User
    participant App as Next.js App
    participant Web3Provider
    participant MetaMask
    participant PermAPI as /api/auth/permissions

    User->>App: Load application
    App->>Web3Provider: Initialize (useEffect on mount)

    Web3Provider->>Web3Provider: Check hasTriedAutoConnect

    alt Has Not Tried Auto-Connect
        Web3Provider->>MetaMask: eth_accounts (no popup)

        alt Previously Connected
            MetaMask-->>Web3Provider: [account address]
            Web3Provider->>Web3Provider: connect()
            Web3Provider->>PermAPI: GET /api/auth/permissions?address={address}
            PermAPI-->>Web3Provider: { role, permissions }
            Web3Provider->>Web3Provider: updateState({ isConnected: true, role, permissions })
            Web3Provider-->>App: Auto-connected successfully
            App-->>User: Show connected state
        else Not Previously Connected
            MetaMask-->>Web3Provider: []
            Web3Provider->>Web3Provider: updateState({ hasTriedAutoConnect: true })
            Web3Provider-->>App: Not auto-connected
            App-->>User: Show "Connect Wallet" button
        end
    end
```

---

## Key Components

### Frontend

- **`WorkingWeb3Provider.tsx`**: Main Web3 context provider, manages wallet connection state
- **`ReownProvider.tsx`**: Reown AppKit configuration for multi-auth support
- **`hooks/useRole.ts`**: Permission helper hook with `canCreateEvent()`, `canEditVenue()`, etc.
- **`hooks/useHybridWallet.ts`**: Unified wallet interface for Web3 + OAuth

### Backend

- **`/api/auth/permissions/route.ts`**: Returns role-based permissions for a wallet address
- **`lib/auth-middleware.ts`**: `requireRole()` middleware for protecting API endpoints
- **Database**: PostgreSQL with Prisma ORM, stores user roles (BLOG_OWNER, CURATOR, VALIDATOR, SCOUT)

### Authentication Methods

1. **MetaMask/Web3**: Direct blockchain wallet connection
2. **Google OAuth**: Social login via Reown AppKit
3. **Email**: Magic link authentication via Reown AppKit

---

## Role Hierarchy

```
BLOG_OWNER (highest privileges)
├── Can manage curators (add/remove)
├── Can create events
├── Can edit venues
├── Can validate venues
└── All admin functions

CURATOR
├── Can create events
├── Can edit venues
└── Can access curator dashboard

VALIDATOR
├── Can validate venues
└── Can access validator dashboard

SCOUT (default role)
├── Can submit venues
├── Can RSVP to events
├── Can refer other users
└── Basic read access
```

---

## Security Notes

1. **No Private Keys on Server**: Wallet-based auth uses signature verification, never stores private keys
2. **Role-Based Authorization**: All protected endpoints check user role via `requireRole()` middleware
3. **Database-Driven Permissions**: Roles stored in PostgreSQL, cached in frontend for UX
4. **Network Validation**: MetaMask connections enforce Celo Sepolia network
5. **Session Management**: OAuth logins maintain server-side sessions with token validation

---

## Error Handling

### Connection Errors

- **MetaMask not installed**: Show "Install MetaMask" message
- **Wrong network**: Auto-prompt to switch to Celo Sepolia
- **User rejection**: Show friendly error, allow retry

### Permission Errors

- **Insufficient permissions**: Show role-specific error message with contact info
- **Session expired**: Auto-redirect to login
- **Invalid token**: Clear session, require re-authentication

---

## Future Enhancements

1. **Referral System** (Task 2.6): Track user referrals and award PXP rewards
2. **Multi-Wallet Support**: Allow users to link multiple wallets to one account
3. **Role Upgrade Requests**: UI for scouts to request curator permissions
4. **Session Persistence**: Remember user preferences across sessions
