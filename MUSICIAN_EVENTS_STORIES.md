# Musician Profiles & Events System User Stories

This document outlines user stories for implementing musician profiles, event management, and jam session functionality in the "Developing My Piano Style" blog.

## Table of Contents

- [User Roles](#user-roles)
- [Epic 1: Musician Profiles](#epic-1-musician-profiles)
- [Epic 2: Event Management System](#epic-2-event-management-system)
- [Epic 3: Jam Session Features](#epic-3-jam-session-features)
- [Epic 4: Event Discovery & RSVP](#epic-4-event-discovery--rsvp)
- [Epic 5: Venue Event Hosting](#epic-5-venue-event-hosting)
- [Database Schema](#database-schema)

---

## User Roles

- **Musician**: User with musical skills who wants to perform, collaborate, or attend jams
- **Event Host**: User who creates and manages events
- **Venue Owner**: Manages venue and can post events at their location
- **Attendee**: Anyone who wants to attend events
- **Blog Owner**: Admin with full control over content and moderation

---

## Epic 1: Musician Profiles

### Story 1.1: Instrument Profile

**As a** musician
**I want to** list the instruments I play
**So that** other musicians and event hosts know my capabilities

**Acceptance Criteria:**

- Can select multiple instruments from predefined list
- Instrument options: Piano, Bass, Drums, Guitar, Vocals, Saxophone, Trumpet, Trombone, Flute, Clarinet, Violin, Cello, Vibraphone, Harmonica, Other
- Can specify primary instrument
- Instruments display on public profile
- Searchable by instrument

**Technical Notes:**

- Add `instruments` String[] field to User model
- Add `primaryInstrument` String? field to User model

---

### Story 1.2: Musical Style & Genre

**As a** musician
**I want to** specify my musical styles and genres
**So that** I can connect with musicians who play similar music

**Acceptance Criteria:**

- Can select multiple styles/genres
- Genre options: Jazz, Classical, Blues, Funk, Rock, Soul, R&B, Latin, Gospel, Contemporary, Folk, Pop, Experimental
- Display prominently on profile
- Use for event matching
- Searchable/filterable

**Technical Notes:**

- Add `musicalStyles` String[] field to User model
- Create genre constants/enum

---

### Story 1.3: Experience Level

**As a** musician
**I want to** indicate my experience level
**So that** event hosts know if I'm suitable for their events

**Acceptance Criteria:**

- Experience level options:
  - "Beginner" - Learning basics, 0-2 years
  - "Intermediate" - Comfortable with fundamentals, 2-5 years
  - "Advanced" - Strong technical skills, 5-10 years
  - "Professional" - Performance career, 10+ years
- Display on profile
- Optional field (privacy)
- Use for event skill level matching

**Technical Notes:**

- Add `experienceLevel` String? field to User model
- Create enum for experience levels

---

### Story 1.4: Availability & Collaboration

**As a** musician
**I want to** indicate my availability for gigs and collaborations
**So that** opportunities can find me

**Acceptance Criteria:**

- Toggle "Available for Paid Gigs"
- Toggle "Open to Jam Sessions"
- Toggle "Available for Collaborations"
- Display badges on profile
- Filter musicians by availability
- Optional text field for details (e.g., "Available weekends only")

**Technical Notes:**

- Add `availableForGigs` Boolean @default(false)
- Add `availableForJams` Boolean @default(true)
- Add `availableForCollabs` Boolean @default(true)
- Add `availabilityNotes` String?

---

### Story 1.5: Performance Portfolio

**As a** musician
**I want to** link my performance recordings and social media
**So that** people can hear my playing

**Acceptance Criteria:**

- Add YouTube links
- Add SoundCloud links
- Add Spotify artist profile
- Add Bandcamp page
- Add Instagram music profile
- Store multiple links per platform
- Display embedded players when possible

**Technical Notes:**

- Add `performanceLinks` Json? field (structure: {youtube: [], soundcloud: [], spotify: string, etc.})
- Use existing `socialLinks` field and extend structure

---

### Story 1.6: Repertoire & Known Songs

**As a** musician
**I want to** list songs/pieces I know
**So that** jam session hosts know what I can play

**Acceptance Criteria:**

- Free-form text list of songs
- Tag songs by genre
- Indicate if lead or accompaniment
- Search/filter musicians by repertoire
- Optional field

**Technical Notes:**

- Add `repertoire` String[] field to User model
- Consider structured format: "Song Name - Artist/Composer (Genre)"

---

## Epic 2: Event Management System

### Story 2.1: Create Event

**As an** event host
**I want to** create an event
**So that** musicians and attendees can discover it

**Acceptance Criteria:**

- Required fields: Title, Date, Time, Venue, Event Type
- Optional fields: Description, Duration, Image, Maximum Attendees
- Event types: "Jam Session", "Open Mic", "Concert", "Workshop", "Rehearsal", "Social Gathering"
- Can connect to existing venue or specify custom location
- Set public/private visibility
- Success confirmation with event link

**Technical Notes:**

- Create Event model with relations to User and Venue
- Add `/app/events/create/page.tsx`
- Add `/app/api/events/route.ts`

---

### Story 2.2: Edit & Cancel Events

**As an** event host
**I want to** edit or cancel my events
**So that** I can update details or handle changes

**Acceptance Criteria:**

- Edit all event details except past dates
- Cancel with reason field
- Notification to RSVPs when edited/cancelled
- Show "CANCELLED" badge on cancelled events
- Keep event history visible

**Technical Notes:**

- Add event status field: "Scheduled", "Cancelled", "Completed"
- Add `cancellationReason` String?
- Implement notification system (future story)

---

### Story 2.3: Recurring Events

**As an** event host
**I want to** create recurring events
**So that** I don't have to manually create weekly/monthly jams

**Acceptance Criteria:**

- Recurrence options: None, Weekly, Bi-weekly, Monthly
- Specify day of week for recurring events
- Set end date or "Until cancelled"
- Generate future occurrences automatically
- Edit single occurrence vs. entire series

**Technical Notes:**

- Add `isRecurring` Boolean
- Add `recurrencePattern` String? ("weekly", "biweekly", "monthly")
- Add `recurrenceDay` String? (day of week)
- Add `recurrenceEndDate` DateTime?
- Create parent-child relationship for occurrences

---

### Story 2.4: Event Details Page

**As a** user
**I want to** view full event details
**So that** I can decide if I want to attend

**Acceptance Criteria:**

- Display all event information
- Show host profile with contact option
- Show venue details with map
- List attendees (if public)
- Show instruments needed/welcome (for jams)
- RSVP button
- Share event link
- Add to calendar option

**Technical Notes:**

- Create `/app/events/[id]/page.tsx`
- Implement social sharing meta tags
- Add calendar export (iCal format)

---

### Story 2.5: Event Image/Banner

**As an** event host
**I want to** add an image to my event
**So that** it's more visually appealing

**Acceptance Criteria:**

- Upload image (max 5MB)
- Support JPG, PNG formats
- Crop/resize to 16:9 ratio
- Default placeholder if no image
- Preview before publishing

**Technical Notes:**

- Add `imageUrl` String? to Event model
- Use same storage as venue images
- Image optimization with Next.js Image component

---

## Epic 3: Jam Session Features

### Story 3.1: Instruments Welcome & Needed

**As a** jam session host
**I want to** specify which instruments are welcome and needed
**So that** musicians know if they fit the session

**Acceptance Criteria:**

- Select multiple instruments from list
- Distinguish "Welcome" vs. "Actively Needed"
- Display prominently on event page
- Filter events by instrument
- Example: "Needed: Bass, Drums | Welcome: All instruments"

**Technical Notes:**

- Add `instrumentsWelcome` String[] to Event model
- Add `instrumentsNeeded` String[] to Event model
- Same instrument list as musician profiles

---

### Story 3.2: Musical Style for Jam

**As a** jam session host
**I want to** specify the musical style
**So that** musicians know what to expect

**Acceptance Criteria:**

- Style options: Jazz, Blues, Funk, Soul, Rock, Latin, Open Genre (anything goes), etc.
- Single style or "Mixed"
- Display prominently
- Filter jams by style
- Match with musician style preferences

**Technical Notes:**

- Add `musicalStyle` String to Event model
- Use same genre list as musician profiles

---

### Story 3.3: Jam Session Format

**As a** jam session host
**I want to** describe the jam format
**So that** attendees know how the session is structured

**Acceptance Criteria:**

- Format options:
  - "Open Jam" - Anyone can join in anytime
  - "Hosted Jam" - Host calls tunes and manages rotation
  - "House Band + Guests" - Rhythm section plays, soloists rotate
  - "Tune Rotation" - Each musician calls a tune in turn
  - "Workshop Style" - Educational with instructor
- Free-text additional details
- Display on event page

**Technical Notes:**

- Add `jamFormat` String? to Event model
- Add `jamFormatDetails` String? for additional notes

---

### Story 3.4: Skill Level Requirement

**As a** jam session host
**I want to** set a skill level expectation
**So that** attendees are appropriately matched

**Acceptance Criteria:**

- Skill level options:
  - "Beginner Friendly" - All levels welcome, patient environment
  - "Intermediate" - Comfortable with changes, reading, or playing by ear
  - "Advanced" - Strong technical skills expected
  - "Professional" - Professional-level playing required
- Display clearly on event page
- Optional field (defaults to "All levels welcome")
- Filter events by skill level

**Technical Notes:**

- Add `skillLevel` String? to Event model
- Default to "All Levels Welcome"

---

### Story 3.5: House Instruments & Equipment

**As a** jam session host
**I want to** list what instruments/equipment the venue provides
**So that** musicians know what to bring

**Acceptance Criteria:**

- Select from list: Piano, Drum Kit, Bass Amp, Guitar Amp, PA System, Microphones, Music Stands, etc.
- Indicate condition/quality (good, acceptable, basic)
- Note if musicians should bring own instruments
- Display on event page
- Link to venue's instrument list

**Technical Notes:**

- Add `houseInstruments` String[] to Event model
- Add `bringYourOwn` Boolean @default(true)
- Add `equipmentNotes` String?
- Connect to venue's `availableInstruments` field

---

### Story 3.6: Song List / Setlist Suggestions

**As a** jam session host
**I want to** provide a suggested song list
**So that** musicians can prepare

**Acceptance Criteria:**

- Add multiple songs with composer/artist
- Mark songs as "Common jazz standards" or custom
- Optional PDF fakebook link
- Display as downloadable list
- Musicians can indicate songs they know

**Technical Notes:**

- Add `suggestedSongs` String[] to Event model
- Add `fakebookUrl` String? for PDF link
- Future: Match with musician repertoire

---

## Epic 4: Event Discovery & RSVP

### Story 4.1: Event Listing Page

**As a** user
**I want to** browse upcoming events
**So that** I can find events to attend

**Acceptance Criteria:**

- Display events in chronological order
- Filter by:
  - Event type (Jam, Concert, etc.)
  - Date range
  - City/Venue
  - Musical style
  - Instrument (jams only)
  - Skill level (jams only)
- Search by name/description
- Show event cards with key info
- Pagination or infinite scroll

**Technical Notes:**

- Create `/app/events/page.tsx`
- Implement query parameters for filters
- Use Next.js server components for performance

---

### Story 4.2: RSVP to Event

**As a** user
**I want to** RSVP to an event
**So that** the host knows I'm attending

**Acceptance Criteria:**

- RSVP options: "Going", "Interested", "Not Going"
- Change RSVP status anytime
- Show RSVP count on event page
- Host can see attendee list
- Optional: Add note with RSVP (e.g., "Bringing my bass")

**Technical Notes:**

- Create EventRSVP model
- Relations: User, Event
- Status enum: "going", "interested", "not_going"
- Add `rsvpNote` String? field

---

### Story 4.3: My Events Calendar

**As a** user
**I want to** see my upcoming events
**So that** I can track what I'm attending or hosting

**Acceptance Criteria:**

- Calendar view of RSVPed events
- List view option
- Filter by "Hosting" vs "Attending"
- Past events archive
- Export to external calendar

**Technical Notes:**

- Add events section to user profile
- Query EventRSVP by userId
- Query Event by hostId
- Calendar component (fullcalendar or similar)

---

### Story 4.4: Event Notifications

**As a** user
**I want to** receive reminders about events
**So that** I don't forget to attend

**Acceptance Criteria:**

- Email notification 24 hours before event
- Email when event is updated/cancelled
- In-app notification badge
- Option to opt-out per event
- Settings for default notification preferences

**Technical Notes:**

- Future story - requires notification system
- Email service integration (SendGrid, etc.)
- Add notification preferences to User model

---

### Story 4.5: Event Attendance Check-in

**As an** event host
**I want to** track who actually attended
**So that** I have accurate attendance records

**Acceptance Criteria:**

- Host can mark attendees as "Attended"
- QR code check-in option
- Attendance stats on event page
- Attendee can self-check-in with confirmation
- Track no-show rate

**Technical Notes:**

- Add `attended` Boolean to EventRSVP
- Add `checkedInAt` DateTime?
- Generate QR code for check-in
- Future: Reward attendance with tokens

---

## Epic 5: Venue Event Hosting

### Story 5.1: Venue Regular Events Schedule

**As a** venue owner
**I want to** display my regular events on my venue page
**So that** musicians know about weekly jams and open mics

**Acceptance Criteria:**

- Add recurring events to venue profile
- Display schedule prominently (e.g., "Open Mic every Tuesday 7pm")
- Link to event details
- Show next occurrence
- Calendar view of venue events

**Technical Notes:**

- Query Event by venueId
- Display recurring events separately from one-time
- Add `regularEvents` Json? to Venue (summary for quick display)

---

### Story 5.2: Venue Available Instruments

**As a** venue owner
**I want to** list instruments available at my venue
**So that** event hosts know what equipment is provided

**Acceptance Criteria:**

- Select instruments from list
- Add condition notes (e.g., "Yamaha upright piano - good condition")
- Display on venue page
- Auto-populate when creating event at venue
- Photos of instruments (optional)

**Technical Notes:**

- Add `availableInstruments` String[] to Venue model
- Add `instrumentDetails` Json? for condition notes
- Link to event `houseInstruments`

---

### Story 5.3: Venue Event Management

**As a** venue owner
**I want to** create and manage events at my venue
**So that** I can promote activities

**Acceptance Criteria:**

- Quick-create event from venue page
- Venue auto-fills when creating
- Manage all venue events from dashboard
- Approve/reject event requests (future)
- Stats on venue event attendance

**Technical Notes:**

- Add "Create Event" button on venue detail page
- Filter events by venueId on venue page
- Venue owner permission checks

---

### Story 5.4: Venue Event Calendar Widget

**As a** venue owner
**I want to** display an event calendar on my venue page
**So that** visitors can see what's happening

**Acceptance Criteria:**

- Calendar or list view toggle
- Show next 30 days of events
- Click event to see details
- Responsive on mobile
- Option to filter by event type

**Technical Notes:**

- Embed calendar component on venue detail page
- Query upcoming events for venue
- Cache for performance

---

## Database Schema

### User Model Extensions

```prisma
model User {
  // ... existing fields ...

  // Musician profile
  instruments           String[]  // Piano, Bass, Drums, etc.
  primaryInstrument     String?   // Main instrument
  musicalStyles         String[]  // Jazz, Blues, Classical, etc.
  experienceLevel       String?   // Beginner, Intermediate, Advanced, Professional
  availableForGigs      Boolean   @default(false)
  availableForJams      Boolean   @default(true)
  availableForCollabs   Boolean   @default(true)
  availabilityNotes     String?
  repertoire            String[]  // Known songs/pieces
  performanceLinks      Json?     // YouTube, SoundCloud, etc.

  // Relations
  hostedEvents          Event[]   @relation("EventHost")
  eventRSVPs            EventRSVP[]
}
```

### Event Model (NEW)

```prisma
model Event {
  id                  Int       @id @default(autoincrement())
  slug                String    @unique

  // Basic info
  title               String
  description         String?   @db.Text
  eventType           String    // JamSession, OpenMic, Concert, Workshop, Rehearsal, Social
  status              String    @default("scheduled") // scheduled, cancelled, completed

  // Scheduling
  eventDate           DateTime
  startTime           String    // HH:MM format
  duration            Int?      // Minutes
  endTime             String?   // HH:MM format

  // Recurrence
  isRecurring         Boolean   @default(false)
  recurrencePattern   String?   // weekly, biweekly, monthly
  recurrenceDay       String?   // monday, tuesday, etc.
  recurrenceEndDate   DateTime?
  parentEventId       Int?      // For recurring event instances

  // Location
  venue               Venue?    @relation(fields: [venueId], references: [id])
  venueId             Int?
  customLocation      String?   // If no venue

  // Host
  host                User      @relation("EventHost", fields: [hostId], references: [id])
  hostId              Int

  // Capacity & visibility
  maxAttendees        Int?
  isPublic            Boolean   @default(true)
  requiresApproval    Boolean   @default(false)

  // Media
  imageUrl            String?

  // Jam session specific
  instrumentsWelcome  String[]  // All instruments that can participate
  instrumentsNeeded   String[]  // Instruments actively needed
  musicalStyle        String?   // Jazz, Blues, etc.
  jamFormat           String?   // Open, Hosted, House Band, etc.
  jamFormatDetails    String?
  skillLevel          String?   // Beginner Friendly, Intermediate, Advanced, Professional
  houseInstruments    String[]  // Provided by venue
  bringYourOwn        Boolean   @default(true)
  equipmentNotes      String?
  suggestedSongs      String[]
  fakebookUrl         String?

  // Metadata
  cancellationReason  String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  rsvps               EventRSVP[]

  @@index([eventDate, status])
  @@index([venueId])
  @@index([hostId])
  @@index([eventType])
}
```

### EventRSVP Model (NEW)

```prisma
model EventRSVP {
  id              Int       @id @default(autoincrement())

  event           Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId         Int

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          Int

  status          String    // going, interested, not_going
  rsvpNote        String?   // Optional note from attendee

  attended        Boolean   @default(false)
  checkedInAt     DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([eventId, userId])
  @@index([userId])
  @@index([eventId, status])
}
```

### Venue Model Extensions

```prisma
model Venue {
  // ... existing fields ...

  // Event hosting
  availableInstruments  String[]  // Piano, Drums, PA, etc.
  instrumentDetails     Json?     // Condition, make/model notes
  regularEvents         Json?     // Summary of recurring events

  // Relations
  events                Event[]
}
```

---

## Implementation Priority

### Phase 1: Core Musician Profiles

1. Story 1.1: Instrument Profile
2. Story 1.2: Musical Style & Genre
3. Story 1.3: Experience Level
4. Story 1.4: Availability & Collaboration

### Phase 2: Basic Events

1. Story 2.1: Create Event
2. Story 2.4: Event Details Page
3. Story 4.1: Event Listing Page
4. Story 4.2: RSVP to Event

### Phase 3: Jam Session Features

1. Story 3.1: Instruments Welcome & Needed
2. Story 3.2: Musical Style for Jam
3. Story 3.3: Jam Session Format
4. Story 3.4: Skill Level Requirement

### Phase 4: Advanced Features

1. Story 2.3: Recurring Events
2. Story 3.5: House Instruments & Equipment
3. Story 4.3: My Events Calendar
4. Story 5.1: Venue Regular Events Schedule

---

## Notes

- All musician profile fields are optional for privacy
- Event system designed to be flexible beyond just jam sessions
- Integration with existing venue and user systems
- Future: Token rewards for event hosting and attendance
- Future: Event ratings and reviews
- Future: Private/invite-only events
- Future: Ticket sales integration
