# Onboarding System - Class Diagram

```mermaid
classDiagram
    %% ==========================================
    %% Domain Models (Database Entities)
    %% ==========================================

    class User {
        +Int id
        +String walletAddress?
        +String username?
        +String passwordHash?
        +UserRole role
        +String displayName?
        +String email?
        +Boolean emailVerified
        +String bio?
        +String avatar?
        +String location?
        +Boolean onboardingCompleted
        +Int onboardingStep?
        +String[] userInterests
        +DateTime lastOnboardingNudge?
        +Boolean profileCompleted
        +DateTime profileCompletedAt?
        +DateTime createdAt
        +DateTime updatedAt
    }

    class MusicianProfile {
        +Int id
        +Int userId
        +String[] instruments
        +String[] musicalStyles
        +String[] genres
        +String experienceLevel?
        +Int yearsPlaying?
        +Boolean availableForGigs
        +Boolean availableForCollab
        +String availabilityNotes?
        +String[] recordingLinks
        +Json socialMedia?
        +String[] repertoire
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Session {
        +String id
        +Int userId
        +String token
        +DateTime expiresAt
        +DateTime createdAt
    }

    %% ==========================================
    %% React Components (UI Layer)
    %% ==========================================

    class WelcomeWizard {
        -Int currentStep
        -Boolean isVisible
        -Boolean isClosing
        -String displayName
        -String location
        -String bio
        -Boolean? isMusician
        -String[] selectedInterests
        -Boolean isSaving

        +handleClose() void
        +saveProgress(step, completed) Promise~void~
        +handleNext() Promise~void~
        +handleSkip() Promise~void~
        +handleComplete() Promise~void~
        +toggleInterest(interestId) void
        -renderStep1() JSX
        -renderStep2() JSX
        -renderStep3() JSX
        -renderStep4() JSX
    }

    class ProfileProgress {
        -Boolean isDismissed
        -CompletionChecks checks
        -Int completedChecks
        -Int totalChecks
        -Int completionPercentage

        +handleDismiss() void
        +calculateCompletion() Int
        -renderChecklist() JSX
        -renderProgressBar() JSX
    }

    %% ==========================================
    %% Value Objects
    %% ==========================================

    class WizardStep {
        <<enumeration>>
        WELCOME = 1
        PROFILE_SETUP = 2
        INTERESTS = 3
        PLATFORM_TOUR = 4
    }

    class Interest {
        +String id
        +String label
        +String icon
    }

    class CompletionChecks {
        +Boolean hasDisplayName
        +Boolean hasEmail
        +Boolean hasEmailVerified
        +Boolean hasBio
        +Boolean hasAvatar
        +Boolean hasLocation
        +Boolean hasMusicianProfile
    }

    %% ==========================================
    %% API Services (Backend Layer)
    %% ==========================================

    class OnboardingProgressAPI {
        +POST(request) Promise~Response~
        -validateRequest(data) Boolean
        -updateUserProgress(userId, step, interests) Promise~void~
    }

    class OnboardingCompleteAPI {
        +POST(request) Promise~Response~
        -validateRequest(data) Boolean
        -markOnboardingComplete(userId, interests) Promise~void~
    }

    class UserProfileAPI {
        +PATCH(request) Promise~Response~
        -validateProfileData(data) Boolean
        -updateUserProfile(userId, data) Promise~void~
    }

    class MusicianProfileAPI {
        +POST(request) Promise~Response~
        +GET(request) Promise~Response~
        -createMusicianProfile(userId) Promise~void~
        -getMusicianProfile(userId) Promise~MusicianProfile~
    }

    %% ==========================================
    %% Data Access Layer
    %% ==========================================

    class PrismaClient {
        <<singleton>>
        +user UserDelegate
        +musicianProfile MusicianProfileDelegate
        +session SessionDelegate
    }

    %% ==========================================
    %% Relationships
    %% ==========================================

    %% Domain relationships
    User "1" --> "0..1" MusicianProfile : has
    User "1" --> "0..*" Session : has

    %% Component dependencies
    WelcomeWizard ..> User : uses
    WelcomeWizard ..> Interest : displays
    WelcomeWizard ..> WizardStep : tracks
    WelcomeWizard ..> OnboardingProgressAPI : calls
    WelcomeWizard ..> OnboardingCompleteAPI : calls
    WelcomeWizard ..> UserProfileAPI : calls
    WelcomeWizard ..> MusicianProfileAPI : calls

    ProfileProgress ..> User : uses
    ProfileProgress ..> CompletionChecks : calculates
    ProfileProgress ..> MusicianProfile : checks

    %% API dependencies
    OnboardingProgressAPI ..> PrismaClient : uses
    OnboardingCompleteAPI ..> PrismaClient : uses
    UserProfileAPI ..> PrismaClient : uses
    MusicianProfileAPI ..> PrismaClient : uses

    OnboardingProgressAPI ..> User : updates
    OnboardingCompleteAPI ..> User : updates
    UserProfileAPI ..> User : updates
    MusicianProfileAPI ..> MusicianProfile : creates/reads

    %% Notes
    note for User "Core user entity with onboarding tracking fields"
    note for WelcomeWizard "4-step wizard: Welcome → Profile → Interests → Tour"
    note for ProfileProgress "Progressive disclosure banner for profile completion"
    note for OnboardingProgressAPI "Saves wizard progress between steps"
```

## Onboarding Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant W as WelcomeWizard
    participant API as Onboarding API
    participant DB as Database

    %% Initial Load
    U->>W: Visits app (not onboarded)
    W->>W: Check user.onboardingCompleted
    W->>W: Resume from user.onboardingStep

    %% Step 1: Welcome
    W->>U: Display Welcome (Step 1)
    U->>W: Click "Continue"
    W->>API: POST /api/onboarding/progress {step: 2}
    API->>DB: UPDATE User SET onboardingStep = 2
    W->>W: setCurrentStep(2)

    %% Step 2: Profile Setup
    W->>U: Display Profile Form (Step 2)
    U->>W: Enter name, location, bio
    U->>W: Select "I'm a musician"
    U->>W: Click "Continue"
    W->>API: POST /api/onboarding/progress {step: 3}
    API->>DB: UPDATE User SET onboardingStep = 3
    W->>W: setCurrentStep(3)

    %% Step 3: Interests
    W->>U: Display Interest Selection (Step 3)
    U->>W: Select interests
    U->>W: Click "Continue"
    W->>API: POST /api/onboarding/progress {step: 4, interests}
    API->>DB: UPDATE User SET onboardingStep = 4, userInterests
    W->>W: setCurrentStep(4)

    %% Step 4: Platform Tour
    W->>U: Display Platform Tour (Step 4)
    U->>W: Click "Start Exploring"

    %% Completion
    W->>API: PATCH /api/user/profile {name, location, bio}
    API->>DB: UPDATE User SET displayName, location, bio

    alt Is Musician
        W->>API: POST /api/user/musician-profile {userId}
        API->>DB: INSERT INTO MusicianProfile
    end

    W->>API: POST /api/onboarding/complete {userId, interests}
    API->>DB: UPDATE User SET onboardingCompleted = true

    W->>U: Redirect to /dashboard
```

## State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> NotStarted: User created

    NotStarted --> Step1Welcome: User logs in

    Step1Welcome --> Step2Profile: Click Continue
    Step1Welcome --> Dismissed: Click Close

    Step2Profile --> Step3Interests: Click Continue
    Step2Profile --> Step3Interests: Click Skip
    Step2Profile --> Dismissed: Click Close
    Step2Profile --> Step1Welcome: Data persisted

    Step3Interests --> Step4Tour: Click Continue
    Step3Interests --> Step2Profile: Click Back
    Step3Interests --> Dismissed: Click Close
    Step3Interests --> Step2Profile: Data persisted

    Step4Tour --> Completing: Click Start Exploring
    Step4Tour --> Step3Interests: Click Back
    Step4Tour --> Dismissed: Click Close
    Step4Tour --> Step3Interests: Data persisted

    Completing --> Completed: Save profile data
    Completing --> Completed: Create musician profile (if selected)
    Completing --> Completed: Mark onboarding complete

    Completed --> [*]: Redirect to dashboard

    Dismissed --> NotStarted: Resume later
    Dismissed --> Step1Welcome: Resume from saved step
    Dismissed --> Step2Profile: Resume from saved step
    Dismissed --> Step3Interests: Resume from saved step
    Dismissed --> Step4Tour: Resume from saved step

    note right of NotStarted
        onboardingCompleted = false
        onboardingStep = null
    end note

    note right of Completed
        onboardingCompleted = true
        onboardingStep = null
        userInterests populated
    end note
```

## Key Design Patterns

### 1. **Wizard Pattern**

- Multi-step form with progress tracking
- State persistence between steps
- Resume capability from last saved step

### 2. **Progressive Disclosure**

- `ProfileProgress` component shows completion percentage
- Only displays missing profile items
- Dismissible banner for non-intrusive nudging

### 3. **Repository Pattern**

- All database access through Prisma ORM
- API routes act as service layer
- Clear separation between UI and data access

### 4. **State Management**

- Local state in React components (useState)
- Server state synchronized via API calls
- Optimistic UI updates with error handling

## Database Schema (Onboarding Fields)

```sql
-- User table (onboarding-related fields)
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,

  -- Onboarding tracking
  "onboardingCompleted" BOOLEAN DEFAULT false,
  "onboardingStep" INTEGER,
  "userInterests" TEXT[] DEFAULT '{}',
  "lastOnboardingNudge" TIMESTAMP,

  -- Profile completion
  "profileCompleted" BOOLEAN DEFAULT false,
  "profileCompletedAt" TIMESTAMP,

  -- Profile fields
  "displayName" TEXT,
  "email" TEXT,
  "emailVerified" BOOLEAN DEFAULT false,
  "bio" TEXT,
  "avatar" TEXT,
  "location" TEXT,

  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MusicianProfile table
CREATE TABLE "MusicianProfile" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,

  "instruments" TEXT[],
  "musicalStyles" TEXT[],
  "genres" TEXT[],
  "experienceLevel" TEXT,
  "yearsPlaying" INTEGER,
  "availableForGigs" BOOLEAN DEFAULT false,
  "availableForCollab" BOOLEAN DEFAULT false,

  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /api/onboarding/progress

Save wizard progress between steps.

**Request:**

```json
{
  "userId": 123,
  "step": 2,
  "completed": false,
  "interests": ["discover-venues", "attend-events"]
}
```

**Response:**

```json
{
  "success": true
}
```

### POST /api/onboarding/complete

Mark onboarding as complete.

**Request:**

```json
{
  "userId": 123,
  "interests": ["discover-venues", "attend-events", "connect-musicians"]
}
```

**Response:**

```json
{
  "success": true
}
```

### PATCH /api/user/profile

Update user profile information.

**Request:**

```json
{
  "displayName": "John Doe",
  "location": "Toronto, Canada",
  "bio": "Piano enthusiast exploring jazz..."
}
```

### POST /api/user/musician-profile

Create musician profile.

**Request:**

```json
{
  "userId": 123
}
```

**Response:**

```json
{
  "success": true,
  "profile": {
    "id": 456,
    "userId": 123,
    "instruments": [],
    "musicalStyles": []
  }
}
```

## Component Props

### WelcomeWizard

```typescript
interface WelcomeWizardProps {
  user: {
    id: number
    displayName?: string | null
    username?: string | null
    avatar?: string | null
    onboardingCompleted: boolean
    onboardingStep?: number | null
  }
}
```

### ProfileProgress

```typescript
interface ProfileProgressProps {
  user: {
    id: number
    displayName?: string | null
    email?: string | null
    emailVerified: boolean
    bio?: string | null
    avatar?: string | null
    location?: string | null
    walletAddress?: string | null
    username?: string | null
  }
  hasMusicianProfile: boolean
  onDismiss?: () => void
}
```

## Onboarding Steps Detail

### Step 1: Welcome

- **Purpose:** Greet user and set expectations
- **UI:** Welcome message with piano emoji 🎹
- **CTA:** "Continue" button
- **Skip:** Not allowed

### Step 2: Profile Setup

- **Purpose:** Collect basic profile information
- **Fields:**
  - Display Name (text input)
  - Location (text input, optional)
  - Bio (textarea, optional)
  - Are you a musician? (Yes/No buttons)
- **CTA:** "Continue" or "Skip"
- **Skip:** Allowed, proceeds to Step 3

### Step 3: Interests Selection

- **Purpose:** Understand user goals and personalize experience
- **Options:**
  - 🗺️ Discover piano venues in my area
  - 📝 Submit venues I know about
  - 🎵 Attend jam sessions and events
  - 🤝 Connect with other musicians
  - 🎹 Share my music and performances
- **Selection:** Multi-select (0 or more)
- **CTA:** "Continue"
- **Navigation:** Can go back to Step 2

### Step 4: Platform Tour

- **Purpose:** Educate user about platform features
- **Content:**
  - 🗺️ Venues - Browse and submit
  - 🎵 Events - Find and RSVP
  - 👤 Profile - Build musician profile
  - 🎁 Rewards - Earn PXP tokens
- **CTA:** "Start Exploring!"
- **Navigation:** Can go back to Step 3
- **Action:** Saves all data and redirects to dashboard

## Profile Completion Criteria

ProfileProgress component calculates completion based on:

1. ✅ Has Display Name
2. ✅ Has Email Address
3. ✅ Email Verified
4. ✅ Has Bio
5. ✅ Has Avatar/Photo
6. ✅ Has Location
7. ✅ Has Musician Profile (for musicians)

**Completion Percentage:** `(completed / total) * 100`

**Display:**

- Shows progress bar
- Lists missing items
- Provides direct links to edit profile
- Can be dismissed (stored in user preferences)
