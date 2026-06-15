# Notes & Messages Feature

## Context

Users need to attach rich-text notes to groups (for tracking musical progress/collaboration), events (community discussion), and profiles (public shoutouts + private "scouting" notes visible only to the author). Notes support self-reported practice metrics (time, quality rating) and YouTube links for recordings.

No comment/note infrastructure exists today — only `EventRSVP.notes` (attendee special requests) and `CollabMessage` (peer DMs), neither of which fits this need.

---

## Architecture: Unified `Note` Model

One `Note` model with explicit nullable FK columns for each attachment point. One API, one set of components.

**Privacy rule:** `isPrivate = true` → only the author can read/update/delete. Used for secret profile notes (scouting reports, personal reminders about a musician).

---

## Phase 1: Database Schema

**New model in `prisma/schema.prisma`:**

```prisma
model Note {
  id              Int       @id @default(autoincrement())
  authorId        Int
  author          User      @relation("NoteAuthor", fields: [authorId], references: [id])

  // Exactly one of these is set
  groupId         Int?
  group           Group?    @relation(fields: [groupId], references: [id])
  eventId         Int?
  event           Event?    @relation(fields: [eventId], references: [id])
  profileUserId   Int?      // the user whose profile this note is pinned to
  profileUser     User?     @relation("NoteOnProfile", fields: [profileUserId], references: [id])

  // Content
  title           String?
  body            String    @db.Text   // Markdown

  // Self-reported metrics
  practiceMinutes Int?
  qualityRating   Int?      // 1–5
  youtubeUrls     String[]

  // Visibility
  isPrivate       Boolean   @default(false)

  // PXP tracking
  pxpAwarded      Boolean   @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([groupId])
  @@index([eventId])
  @@index([profileUserId])
  @@index([authorId])
}
```

Add relations to existing models:

- `User`: `notesAuthored Note[] @relation("NoteAuthor")` and `notesOnProfile Note[] @relation("NoteOnProfile")`
- `Group`: `notes Note[]`
- `Event`: `notes Note[]`

**Migration:** `prisma/migrations/20260614000000_add_notes/migration.sql`

**PXPConfig seed entry:** Add `note_practice_session` key (suggested 5 PXP) to award PXP when a note includes `practiceMinutes > 0`.

---

## Phase 2: API Routes

### `app/api/notes/route.ts` (GET / POST)

**GET** — query params: `groupId`, `eventId`, `profileUserId`

- Filters out `isPrivate` notes where `authorId !== currentUser.id`
- Returns: `{ notes[], pagination }`

**POST** — authenticated; body:

```json
{
  "groupId?": 1,
  "eventId?": null,
  "profileUserId?": null,
  "title?": "Tuesday session",
  "body": "Markdown content...",
  "practiceMinutes?": 45,
  "qualityRating?": 4,
  "youtubeUrls?": ["https://youtu.be/..."],
  "isPrivate?": false
}
```

- Validates exactly one attachment FK provided
- Group notes: validates requester is a group member
- If `practiceMinutes > 0`: calls `awardPracticeSession(userId)` in `lib/pxp-rewards.ts`, sets `pxpAwarded = true`

### `app/api/notes/[id]/route.ts` (GET / PUT / DELETE)

- **GET** — 403 if `isPrivate && authorId !== currentUser.id`
- **PUT** — author only; updates title/body/metrics
- **DELETE** — author only

### `app/api/notes/my/route.ts` (GET)

Returns all notes authored by current user plus aggregate metrics:

```json
{
  "notes": [...],
  "metrics": {
    "totalPracticeMinutes": 340,
    "totalNotes": 22,
    "averageQuality": 3.7,
    "pxpFromNotes": 45
  }
}
```

PXP drill-down sourced from `PXPPayment` filtered by `paymentType: 'note_practice_session'`.

---

## Phase 3: Components

### `components/notes/NoteEditor.tsx` (client)

- Markdown textarea with preview toggle (uses `react-markdown` + `remark-gfm`)
- Fields: title (optional), body (required), practiceMinutes, qualityRating (star picker 1–5), youtubeUrls (add/remove list)
- `isPrivate` toggle — shown only when attaching to someone else's profile
- Submit → POST `/api/notes`

### `components/notes/NoteCard.tsx`

- Renders: title, markdown body, metrics row (⏱ 45m · ⭐ 4/5 · 🎥 1 video), author + date
- Private notes show a 🔒 badge (only visible to the author anyway)

### `components/notes/NoteList.tsx`

- Fetches from `/api/notes?{attachmentParam}=X`
- Collapsible section (same pattern as `VenueEvents` in `components/venue/VenueEvents.tsx`)
- "Add Note" button opens NoteEditor inline
- Empty / loading / error states

---

## Phase 4: Integration into Existing Pages

| Page                             | Attachment      | Label                      | Who can create         |
| -------------------------------- | --------------- | -------------------------- | ---------------------- |
| `app/groups/[slug]/page.tsx`     | `groupId`       | "Practice Notes & Updates" | Group members only     |
| `app/events/[id]/page.tsx`       | `eventId`       | "Community Notes"          | Any authenticated user |
| `app/profile/[address]/page.tsx` | `profileUserId` | "Notes"                    | Any authenticated user |

For profile notes on someone else's page: `isPrivate` toggle available (defaults false for public shoutouts). Private notes only appear in the author's own `/notes` dashboard, not on the profile page for anyone else.

---

## Phase 5: Personal Notes Dashboard

**New page: `app/notes/page.tsx`**

- Fetches from `/api/notes/my`
- Summary cards: total practice minutes, avg quality rating, PXP earned from notes
- PXP drill-down: table of `PXPPayment` rows with `paymentType: 'note_practice_session'`
- Notes grouped by context (Groups / Events / Profile mentions / Private)
- Add link to profile page sidebar or header nav

---

## Phase 6: PXP Integration

Add to `lib/pxp-rewards.ts` (follow the same pattern as `awardEventAttendance()`):

```typescript
export async function awardPracticeSession(userId: number) {
  // 1. Look up PXPConfig key 'note_practice_session'
  // 2. Send on-chain ERC-20 transfer from hot wallet via sendPXPReward()
  // 3. Create PXPPayment record with paymentType: 'note_practice_session'
  // 4. Update User.totalPXPEarned
}
```

---

## Files to Create

| File                                                       | Purpose                        |
| ---------------------------------------------------------- | ------------------------------ |
| `prisma/migrations/20260614000000_add_notes/migration.sql` | Schema migration               |
| `app/api/notes/route.ts`                                   | List + create notes            |
| `app/api/notes/[id]/route.ts`                              | Read/update/delete single note |
| `app/api/notes/my/route.ts`                                | Personal notes + metrics       |
| `components/notes/NoteEditor.tsx`                          | Markdown editor component      |
| `components/notes/NoteCard.tsx`                            | Note display component         |
| `components/notes/NoteList.tsx`                            | Collapsible note list          |
| `app/notes/page.tsx`                                       | Personal notes dashboard       |

## Files to Modify

| File                             | Change                                         |
| -------------------------------- | ---------------------------------------------- |
| `prisma/schema.prisma`           | Add Note model + relations to User/Group/Event |
| `lib/pxp-rewards.ts`             | Add `awardPracticeSession()`                   |
| `app/groups/[slug]/page.tsx`     | Add `<NoteList groupId={...} />`               |
| `app/events/[id]/page.tsx`       | Add `<NoteList eventId={...} />`               |
| `app/profile/[address]/page.tsx` | Add `<NoteList profileUserId={...} />`         |
| `data/headerNavLinks.ts`         | Add Notes link (or profile dropdown)           |

## Dependencies to Install

```bash
yarn add react-markdown remark-gfm
```

---

## Verification

1. **Group note + PXP**: Log in as a group member → expand Notes on `/groups/[slug]` → create a note with 45 practiceMinutes → note appears, PXP awarded, shows in `/notes` dashboard metrics
2. **Event note**: Add a note on any event page → visible to other users (no private toggle)
3. **Public profile shoutout**: Visit another user's profile → add a note (isPrivate off) → visible on their profile
4. **Secret note**: Add a note (isPrivate on) on another user's profile → NOT visible on their profile page; only visible in your own `/notes` dashboard under "Private"
5. **PXP drill-down**: Visit `/notes` → metrics show total practice time, avg quality; PXP table lists each practice session award
