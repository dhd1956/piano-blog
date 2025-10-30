# Sprint 3: Social & Discovery Features - Jira Stories

**Sprint Goal:** Enable musicians to discover each other and coordinate jam sessions/gigs
**Estimated Duration:** 2-3 weeks
**Total Story Points:** 55

---

## Epic 1: Musicians Directory (21 points)

### WPB-201: Create Musicians Directory Page

**Story Points:** 8
**Priority:** High
**Type:** Feature

**As a** musician
**I want to** browse a directory of other musicians on the platform
**So that** I can find potential collaborators and bandmates

**Acceptance Criteria:**

- [ ] New page at `/musicians` displays all users with musician profiles
- [ ] Grid layout with profile cards showing:
  - Avatar/profile picture
  - Display name
  - Primary instrument(s) (max 3 shown)
  - Location (city)
  - Musical style tags (max 2 shown)
  - Availability badge (available for gigs/collabs)
  - "View Profile" button
- [ ] Empty state message when no musicians found
- [ ] Pagination (20 musicians per page)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading skeleton while fetching data

**Technical Notes:**

- API endpoint: `GET /api/musicians`
- Query params: `?page=1&limit=20`
- Include only users with `musicianProfile` populated
- Exclude users with `publicProfile: false`

**Dependencies:** None

---

### WPB-202: Add Search & Filter to Musicians Directory

**Story Points:** 8
**Priority:** High
**Type:** Feature

**As a** musician
**I want to** filter and search for musicians by specific criteria
**So that** I can quickly find musicians matching my needs

**Acceptance Criteria:**

- [ ] Search bar filters by:
  - Display name
  - Username
  - City/location
- [ ] Filter sidebar with options:
  - **Instruments:** Multi-select checkboxes (Piano, Guitar, Drums, Bass, etc.)
  - **Musical Styles:** Multi-select checkboxes (Jazz, Classical, Blues, Rock, etc.)
  - **Location:** Text input with autocomplete
  - **Availability:** Checkboxes (Available for Gigs, Available for Collabs)
  - **Experience Level:** Radio buttons (Beginner, Intermediate, Advanced, Professional, Any)
- [ ] "Clear Filters" button resets all filters
- [ ] Filter count badge shows active filter count
- [ ] Results update in real-time as filters change
- [ ] URL params update to reflect filters (shareable links)
- [ ] "No results" message when filters return empty

**API Updates:**

```
GET /api/musicians?search=john&instruments=Piano,Guitar&styles=Jazz&city=Toronto&availableForGigs=true&experienceLevel=Advanced&page=1&limit=20
```

**Technical Notes:**

- Use query builder with Prisma `where` clauses
- Case-insensitive search
- Array filters use `hasSome` or `hasEvery`
- Debounce search input (300ms)

**Dependencies:** WPB-201

---

### WPB-203: Add Sort Options to Musicians Directory

**Story Points:** 3
**Priority:** Medium
**Type:** Feature

**As a** musician
**I want to** sort the musicians directory by different criteria
**So that** I can find the most relevant or active musicians first

**Acceptance Criteria:**

- [ ] Sort dropdown with options:
  - Recently Active (default)
  - Most Experienced (by yearsPlaying DESC)
  - Highest Reputation (by totalPXPEarned DESC)
  - Name (A-Z)
  - Name (Z-A)
  - Newest Members (by createdAt DESC)
- [ ] Selected sort option persists in URL params
- [ ] Sort works in combination with filters
- [ ] Visual indicator shows current sort method

**Technical Notes:**

- API param: `?sortBy=pxp&sortOrder=desc`
- Default: `sortBy=lastActive&sortOrder=desc`

**Dependencies:** WPB-201

---

### WPB-204: Add "Find Musicians" Link to Navigation

**Story Points:** 2
**Priority:** High
**Type:** Task

**As a** user
**I want to** easily access the musicians directory from anywhere
**So that** I can quickly browse musicians

**Acceptance Criteria:**

- [ ] Add "Musicians" link to main navigation menu
- [ ] Place between "Venues" and "Submit" in nav order
- [ ] Link goes to `/musicians`
- [ ] Navigation item highlights when on musicians page
- [ ] Mobile navigation includes the link

**Technical Notes:**

- Update `/data/headerNavLinks.ts`
- Add icon: 🎸 or 👥

**Dependencies:** WPB-201

---

## Epic 2: Profile Enhancements (13 points)

### WPB-205: Add Profile Actions (Connect/Invite)

**Story Points:** 5
**Priority:** Medium
**Type:** Feature

**As a** musician
**I want to** interact with other musicians' profiles
**So that** I can connect with them or invite them to events

**Acceptance Criteria:**

- [ ] On profile view page (when viewing others' profiles), show action buttons:
  - **"Connect"** button (if not connected)
  - **"Connected"** badge (if already connected)
  - **"Message"** button (placeholder - disabled if messaging not implemented)
  - **"Invite to Event"** button (when events system exists)
- [ ] Buttons only visible when viewing someone else's profile
- [ ] Connect button triggers connection request
- [ ] Success/error notifications for actions
- [ ] Button states update after actions

**Technical Notes:**

- Create Connection model first (see schema below)
- API endpoint: `POST /api/connections`
- Body: `{ receiverId: number }`

**Dependencies:** None (but limited until WPB-210)

---

### WPB-206: Add Recent Activity Feed to Profile

**Story Points:** 5
**Priority:** Low
**Type:** Feature

**As a** visitor
**I want to** see a musician's recent activity on their profile
**So that** I can gauge how active they are in the community

**Acceptance Criteria:**

- [ ] New "Recent Activity" section on profile view shows:
  - Venues discovered (last 5)
  - Events attended (last 5)
  - Reviews written (last 5)
- [ ] Each activity item shows:
  - Activity type icon
  - Activity description
  - Relative time (e.g., "2 days ago")
  - Link to related item (venue, event, review)
- [ ] Privacy: Only show if profile is public OR viewer is profile owner
- [ ] Empty state: "No recent activity" message

**Technical Notes:**

- Fetch from existing tables (Venue, VenueReview)
- Events table doesn't exist yet - add when available
- Order by `createdAt DESC`
- Limit 5 per activity type

**Dependencies:** None

---

### WPB-207: Add Profile Visibility Settings

**Story Points:** 3
**Priority:** Medium
**Type:** Feature

**As a** musician
**I want to** control who can see my profile
**So that** I can maintain my privacy preferences

**Acceptance Criteria:**

- [ ] Add to profile edit page: "Profile Visibility" section
- [ ] Radio button options:
  - **Public:** Anyone can view (default)
  - **Musicians Only:** Only users with musician profiles
  - **Connections Only:** Only people I've connected with
  - **Private:** Only me
- [ ] Setting saves with profile updates
- [ ] Profile view respects visibility setting:
  - Shows "Private Profile" message if not authorized
  - Musicians-only: Checks if viewer has musicianProfile
  - Connections-only: Checks Connection table
- [ ] Directory excludes non-public profiles (unless viewer authorized)

**Database Changes:**

```prisma
// Update User model
model User {
  // ... existing fields
  profileVisibility String @default("public") // public, musicians_only, connections_only, private
}
```

**Dependencies:** WPB-205 (for connections check)

---

## Epic 3: Events System (21 points)

### WPB-208: Create Event Database Schema

**Story Points:** 2
**Priority:** High
**Type:** Task

**As a** developer
**I want to** define the Event and EventAttendee models
**So that** events can be stored and managed in the database

**Acceptance Criteria:**

- [ ] Add Event model to Prisma schema:

  ```prisma
  model Event {
    id                  Int               @id @default(autoincrement())
    title               String
    description         String?           @db.Text
    eventType           String            // jam_session, gig, open_mic, rehearsal, masterclass
    startTime           DateTime
    endTime             DateTime?
    venueId             Int?
    venue               Venue?            @relation(fields: [venueId], references: [id])
    hostId              Int
    host                User              @relation("EventHost", fields: [hostId], references: [id])
    maxAttendees        Int?
    isPublic            Boolean           @default(true)
    requiredInstruments String[]
    skillLevel          String?           // beginner, intermediate, advanced, all
    attendees           EventAttendee[]
    createdAt           DateTime          @default(now())
    updatedAt           DateTime          @updatedAt

    @@index([eventType])
    @@index([startTime])
    @@index([venueId])
    @@index([hostId])
  }

  model EventAttendee {
    id         Int      @id @default(autoincrement())
    eventId    Int
    event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
    userId     Int
    user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    status     String   // interested, going, maybe, not_going
    instrument String?  // What instrument they'll bring/play
    notes      String?  @db.Text
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt

    @@unique([eventId, userId])
    @@index([eventId])
    @@index([userId])
  }
  ```

- [ ] Update User model to include event relations:
  ```prisma
  model User {
    // ... existing fields
    hostedEvents   Event[]          @relation("EventHost")
    eventAttendees EventAttendee[]
  }
  ```
- [ ] Run `npx prisma db push`
- [ ] Run `npx prisma generate`
- [ ] Verify database schema in PostgreSQL

**Dependencies:** None

---

### WPB-209: Create Event Creation Page

**Story Points:** 8
**Priority:** High
**Type:** Feature

**As a** musician
**I want to** create an event (jam session, gig, etc.)
**So that** other musicians can discover and join it

**Acceptance Criteria:**

- [ ] New page at `/events/create`
- [ ] Form fields:
  - **Title:** Text input (required, max 100 chars)
  - **Event Type:** Dropdown (Jam Session, Gig, Open Mic, Rehearsal, Masterclass)
  - **Description:** Textarea (optional, max 1000 chars)
  - **Date:** Date picker (required)
  - **Start Time:** Time picker (required)
  - **End Time:** Time picker (optional)
  - **Venue:** Searchable dropdown of venues from database (optional)
  - **Location:** Text input (if no venue selected)
  - **Required Instruments:** Multi-select (Piano, Guitar, Drums, Bass, Vocals, etc.)
  - **Skill Level:** Radio buttons (All Levels, Beginner, Intermediate, Advanced, Professional)
  - **Max Attendees:** Number input (optional)
  - **Public/Private:** Toggle switch (default: Public)
- [ ] Form validation:
  - Title required
  - Date cannot be in the past
  - Start time required
  - Either venue OR location required
- [ ] "Create Event" button submits form
- [ ] Success: Redirect to event detail page
- [ ] Error: Show validation errors inline
- [ ] Venue search uses autocomplete with existing venues

**API Endpoint:**

```
POST /api/events
Body: { title, eventType, description, startTime, endTime, venueId, location, requiredInstruments, skillLevel, maxAttendees, isPublic }
Response: { event: { id, title, ... } }
```

**Technical Notes:**

- Check user authentication before allowing creation
- Auto-set hostId to current user
- Use date-fns for date/time handling
- Validate datetime is in future

**Dependencies:** WPB-208

---

### WPB-210: Create Events Listing Page

**Story Points:** 8
**Priority:** High
**Type:** Feature

**As a** musician
**I want to** browse upcoming events
**So that** I can find jam sessions and gigs to attend

**Acceptance Criteria:**

- [ ] New page at `/events`
- [ ] Display events in list view with cards showing:
  - Event type icon/badge
  - Title
  - Date & time (formatted: "Wed, Nov 15, 2025 at 7:00 PM")
  - Venue name (with link to venue page) OR location text
  - Host name (with link to profile)
  - Required instruments (tags)
  - Attendee count / Max attendees (e.g., "5/10 attending")
  - "View Details" button
- [ ] Filter sidebar:
  - **Date Range:** Date picker (Today, This Week, This Month, Custom)
  - **Event Type:** Multi-select checkboxes
  - **City/Location:** Text input
  - **Instruments Needed:** Multi-select checkboxes
  - **Skill Level:** Radio buttons
- [ ] Sort options:
  - Upcoming (soonest first) - default
  - Recently Added
  - Most Popular (by attendee count)
- [ ] Pagination (20 events per page)
- [ ] Empty state: "No upcoming events" with "Create Event" CTA
- [ ] Past events excluded by default (option to "Show Past Events")

**API Endpoint:**

```
GET /api/events?dateFrom=2025-11-01&dateTo=2025-11-30&eventType=jam_session,gig&city=Toronto&instruments=Piano&skillLevel=intermediate&sortBy=startTime&page=1&limit=20
Response: { events: [...], totalCount: 45, hasMore: true }
```

**Technical Notes:**

- Default filter: `startTime >= now()`
- Include venue and host relations
- Calculate attendee count via EventAttendee table

**Dependencies:** WPB-208, WPB-209

---

### WPB-211: Create Event Detail Page with RSVP

**Story Points:** 8
**Priority:** High
**Type:** Feature

**As a** musician
**I want to** view event details and RSVP
**So that** I can indicate my attendance and see who else is coming

**Acceptance Criteria:**

- [ ] New page at `/events/[id]`
- [ ] Display event details:
  - Header: Title, event type badge, date/time
  - Description (full text)
  - Venue info (name, address, map link) OR location text
  - Host info (name, avatar, link to profile)
  - Required instruments (tags)
  - Skill level badge
  - Max attendees (if set)
- [ ] RSVP section:
  - Show current user's RSVP status (if logged in)
  - Buttons: "Going", "Interested", "Maybe", "Can't Go"
  - If "Going", prompt for instrument selection: "What will you play?"
  - Optional notes field: "Anything to share with the host?"
- [ ] Attendees list:
  - Avatar grid of all "Going" attendees
  - Expandable list showing:
    - Name (link to profile)
    - Instrument they're bringing
    - Notes (if any)
  - Count: "5 going, 3 interested"
- [ ] Actions (if user is host):
  - "Edit Event" button → `/events/[id]/edit`
  - "Cancel Event" button (with confirmation)
- [ ] Share buttons:
  - Copy event link
  - Share to social media (optional)

**API Endpoints:**

```
GET /api/events/[id]
Response: { event: { id, title, ..., attendees: [...] } }

POST /api/events/[id]/rsvp
Body: { status: "going", instrument: "Piano", notes: "..." }
Response: { success: true, attendee: {...} }

DELETE /api/events/[id]/rsvp
Response: { success: true }
```

**Technical Notes:**

- Check if user is authenticated before showing RSVP
- Disable RSVP if event is past
- Show "Event Full" if maxAttendees reached (unless user is host)
- Use optimistic updates for RSVP status

**Dependencies:** WPB-208, WPB-209

---

### WPB-212: Add "Events" Link to Navigation

**Story Points:** 1
**Priority:** High
**Type:** Task

**As a** user
**I want to** easily access the events page from anywhere
**So that** I can browse upcoming events

**Acceptance Criteria:**

- [ ] Add "Events" link to main navigation menu
- [ ] Place after "Musicians" in nav order
- [ ] Link goes to `/events`
- [ ] Navigation item highlights when on events pages
- [ ] Mobile navigation includes the link

**Technical Notes:**

- Update `/data/headerNavLinks.ts`
- Add icon: 📅 or 🎉

**Dependencies:** WPB-210

---

## Epic 4: Connection System (Bonus - 13 points)

### WPB-213: Create Connection Database Schema

**Story Points:** 2
**Priority:** Medium
**Type:** Task

**As a** developer
**I want to** define the Connection model
**So that** musicians can connect with each other

**Acceptance Criteria:**

- [ ] Add Connection model to Prisma schema:

  ```prisma
  model Connection {
    id          Int      @id @default(autoincrement())
    requesterId Int
    requester   User     @relation("ConnectionRequester", fields: [requesterId], references: [id], onDelete: Cascade)
    receiverId  Int
    receiver    User     @relation("ConnectionReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
    status      String   @default("pending") // pending, accepted, declined
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@unique([requesterId, receiverId])
    @@index([requesterId])
    @@index([receiverId])
    @@index([status])
  }
  ```

- [ ] Update User model:
  ```prisma
  model User {
    // ... existing fields
    sentConnections     Connection[] @relation("ConnectionRequester")
    receivedConnections Connection[] @relation("ConnectionReceiver")
  }
  ```
- [ ] Run `npx prisma db push`
- [ ] Run `npx prisma generate`

**Dependencies:** None

---

### WPB-214: Implement Connection Request Flow

**Story Points:** 5
**Priority:** Medium
**Type:** Feature

**As a** musician
**I want to** send and accept connection requests
**So that** I can build my network of musical collaborators

**Acceptance Criteria:**

- [ ] "Connect" button on profile sends connection request
- [ ] API endpoint: `POST /api/connections { receiverId }`
- [ ] Prevent duplicate requests
- [ ] Notification shows: "Connection request sent to [Name]"
- [ ] Button changes to "Request Pending" (disabled)
- [ ] Receiver sees notification: "New connection request from [Name]"
- [ ] Receiver can:
  - Accept: `PATCH /api/connections/[id] { status: "accepted" }`
  - Decline: `PATCH /api/connections/[id] { status: "declined" }`
- [ ] After acceptance, both users see "Connected" badge on each other's profiles
- [ ] Connection requests visible in profile dropdown or notifications area

**Technical Notes:**

- Check authentication
- Prevent self-connection (requesterId !== receiverId)
- Check existing connection before creating new one

**Dependencies:** WPB-213

---

### WPB-215: Create My Connections Page

**Story Points:** 5
**Priority:** Low
**Type:** Feature

**As a** musician
**I want to** view all my connections in one place
**So that** I can manage my musical network

**Acceptance Criteria:**

- [ ] New page at `/profile/connections` or `/musicians/my-connections`
- [ ] Tabs:
  - **Connections** (accepted): Grid of connected musicians
  - **Pending Requests** (sent): Requests I've sent
  - **Received Requests** (pending): Requests I need to respond to
- [ ] Each connection card shows:
  - Avatar
  - Name
  - Instruments
  - Location
  - "View Profile" button
  - Actions: "Message", "Remove Connection" (with confirmation)
- [ ] Received requests include "Accept" / "Decline" buttons
- [ ] Search/filter connections by name or instrument
- [ ] Empty states for each tab

**API Endpoint:**

```
GET /api/connections?status=accepted&userId=[currentUserId]
Response: { connections: [...] }
```

**Technical Notes:**

- Fetch from Connection table
- Include related User data
- Separate queries for sent vs received

**Dependencies:** WPB-214

---

### WPB-216: Add Connection Count to Profile

**Story Points:** 1
**Priority:** Low
**Type:** Task

**As a** musician
**I want to** see how many connections another musician has
**So that** I can gauge their network size

**Acceptance Criteria:**

- [ ] Add "Connections" stat to profile stats grid (next to PXP, Venues, Reviews)
- [ ] Show count of accepted connections only
- [ ] Clickable: Links to connections page (if own profile) or shows tooltip (if other's profile)
- [ ] Icon: 👥 or 🤝

**Technical Notes:**

- Query: `Connection.count({ where: { status: 'accepted', OR: [{ requesterId }, { receiverId }] } })`
- Cache count for performance

**Dependencies:** WPB-213

---

## Summary

**Total Story Points:** 68 (55 core + 13 bonus)

**Epic Breakdown:**

1. **Musicians Directory:** 21 points (4 stories)
2. **Profile Enhancements:** 13 points (3 stories)
3. **Events System:** 21 points (5 stories)
4. **Connection System (Bonus):** 13 points (4 stories)

**Priority Order for Implementation:**

1. WPB-208 (Event Schema) - Foundational
2. WPB-201 (Musicians Directory Page) - Quick win
3. WPB-202 (Directory Search/Filter) - High value
4. WPB-209 (Event Creation) - Core feature
5. WPB-210 (Events Listing) - Core feature
6. WPB-211 (Event Detail/RSVP) - Core feature
7. WPB-203 (Directory Sort) - Nice to have
8. WPB-205 (Profile Actions) - Enables connections
9. WPB-213 (Connection Schema) - For connections
10. WPB-214 (Connection Requests) - Social feature
11. Remaining stories - Lower priority

**Estimated Timeline:**

- **Week 1:** Musicians Directory (WPB-201, 202, 203, 204)
- **Week 2:** Events System Part 1 (WPB-208, 209, 210, 212)
- **Week 3:** Events System Part 2 (WPB-211) + Profile Enhancements (WPB-205, 206, 207)
- **Week 4 (Optional):** Connection System (WPB-213, 214, 215, 216)

---

**Last Updated:** 2025-10-29
**Status:** Ready for Sprint Planning
