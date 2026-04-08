# Plan: Musician Collaboration Discovery & Connection

## Context

CMs want to find collaborators who specialise in specific musical roles (lyrics, melody, chords, arrangements, charts/scores, instrument parts) so they can achieve their musical goals. The feature has two parts:

1. **Discovery** — search and filter the musicians directory by collaboration specialisation
2. **Connection** — lightweight in-app way to reach out once a collaborator is found, without building a full messaging system (leverage existing notification infrastructure + profile contact info)

The QR code (already used for PXP tipping at venues) is a natural in-person discovery channel — it will also surface collaboration types when scanned.

The QR code (already used for PXP tipping at venues) is a natural in-person discovery channel — it will also surface collaboration types when scanned.

> **Q: Can Event RSVP be used for collaboration grouping?**
> Yes — added as Step 8. When CMs RSVP to the same jam/event, the event detail page will show attendees with their collaboration type pills and a Collaborate button, making it easy to find collaborators you'll actually be in the same room with.

> **Q: Dolby On recordings — direct upload to GPN or via YouTube?**
> Recommend: export from Dolby On → upload to YouTube (unlisted is fine) → paste the link into your GPN profile's Recording Links field. The app already has full YouTube integration (video gallery, handle linking). Building direct audio upload would require storage infrastructure (costs, file size limits, audio player). YouTube is free, handles all that, and Dolby On supports direct YouTube export.

> **Q: Can collaboration types be searched along with filtering by musical styles, genres, and experience level?**
> Yes — Step 2 (API) and Step 5 (directory UI) will be extended to support all of these as combinable filters: collaboration type, musical style, genre, and experience level. A CM could filter for "Advanced pianists who write Lyrics in the Jazz style" in one query.

> **Q: How to standardize styles and genres so they can be chosen from a list OR entered free-form?**
> Use a "tag input with suggestions" pattern (combobox): show a curated list of common values as clickable chips (Jazz, Classical, Blues, Latin, Folk, Pop, Rock, etc. for styles; Bebop, Stride, Ragtime, Bossa Nova, etc. for genres), but also allow the user to type and add anything not on the list. This keeps data consistent for filtering while not restricting creativity. We'll create a `constants/musicOptions.ts` file with the canonical lists. Existing free-form values users have already entered are preserved as-is.

---

## What already exists (reuse)

- `MusicianProfile` model — has `availableForCollab: Boolean`, `availabilityNotes`, instruments, styles
- `/app/musicians/page.tsx` — paginated grid, no filters yet
- `/api/musicians` route — returns paginated list (needs filter params added)
- `Notification` model — type/title/message/link, used for REWARD_EARNED etc. Extend for COLLABORATION_REQUEST
- `NotificationBell` component — already polls, renders all notification types
- `UserProfileQRCard` — encodes profile data; already shows skills/badges
- Profile edit page — multi-value array pattern (instruments, styles) for adding collaboration types
- `/app/profile/[address]/page.tsx` — has TipButton; add CollabButton alongside it

---

## Implementation Plan

### Step 1 — Schema: add `collaborationTypes` to MusicianProfile

**File:** `prisma/schema.prisma`

Add field to MusicianProfile:

```
collaborationTypes  String[]   // e.g. ["LYRICS","MELODY","CHORDS"]
```

Possible values: `LYRICS`, `MELODY`, `CHORDS`, `ARRANGEMENTS`, `CHARTS_SCORES`, `INSTRUMENT_PARTS`, `VOCALS`, `PRODUCTION`, `MIXING`

Run `prisma migrate dev --name add-collaboration-types`.

---

### Step 2 — API: update `/api/musicians` to support filters

**File:** `app/api/musicians/route.ts`

Add query param support:

- `?search=name` — filter by displayName or username (case-insensitive)
- `?collabType=LYRICS` — filter by collaborationTypes contains value
- `?style=Jazz` — filter by musicalStyles contains value
- `?genre=Bebop` — filter by genres contains value
- `?experienceLevel=Advanced` — exact match on experienceLevel
- `?availableForCollab=true` — filter to collab-available only

Prisma filter additions:

```ts
where: {
  ...(search && { user: { OR: [
    { displayName: { contains: search, mode: 'insensitive' } },
    { username:    { contains: search, mode: 'insensitive' } }
  ]}}),
  ...(collabType       && { collaborationTypes: { has: collabType } }),
  ...(style            && { musicalStyles:      { has: style } }),
  ...(genre            && { genres:             { has: genre } }),
  ...(experienceLevel  && { experienceLevel }),
  ...(availableForCollab && { availableForCollab: true }),
}
```

---

### Step 3 — Profile edit: add Collaboration Types section

**File:** `app/profile/[address]/edit/page.tsx`

Add a new section after the existing Availability section (WPB-112):

- **Collaboration types**: multi-select checkbox grid (fixed list: Lyrics writing, Melody composition, Chord progressions, Arrangements, Charts & scores, Instrument parts, Vocals, Production, Mixing)
- **Musical styles & genres**: upgrade existing free-text add inputs to combobox — show canonical options from `constants/musicOptions.ts` as suggestions, but still accept free-form entries not on the list
- Saves to `musicianProfile.collaborationTypes`, `musicalStyles`, `genres`
- Include all in localStorage draft key `profile_draft_{address}`

---

### Step 4 — Profile display: show collaboration type badges

**File:** `app/profile/[address]/page.tsx`

In the existing Musician Profile section, below the availability badges ("Available for Gigs / Collabs"), add a row of collaboration type pills — small coloured tags showing what the musician offers (e.g. "🎵 Lyrics", "🎹 Chords").

---

### Step 5 — Musicians directory: add search + filter bar

**File:** `app/musicians/page.tsx`

Above the existing musician grid, add a filter bar with:

- Text search input (debounced, 300ms) — searches by name
- Filter chips row: Collaboration type (toggle one or more)
- Filter chips row: Musical style (from canonical list)
- Filter chips row: Genre (from canonical list)
- Experience level dropdown: All / Beginner / Intermediate / Advanced / Professional
- "Available for collabs only" toggle
- All filters are combinable; reset pagination to page 1 on any change
- "Clear all filters" link when any filter is active

---

### Step 6 — Connection: "Collaborate" button + notification

**New files:**

- `components/profile/CollabRequestButton.tsx`
- `app/api/collaborate/route.ts`

**Flow:**

1. "Collaborate" button appears on another CM's profile (alongside existing TipButton), only when viewer is authenticated and not the profile owner
2. Clicking opens a small modal: free-text field ("What do you want to collaborate on?", max 200 chars) + Send button
3. POST `/api/collaborate` → creates a `Notification` for the recipient:
   - `type: "COLLABORATION_REQUEST"`
   - `title: "Collaboration request from {senderName}"`
   - `message`: the typed note
   - `link: /profile/{senderAddress}` (recipient clicks through to see sender's contact info)
4. Existing `NotificationBell` surfaces it automatically — no extra UI needed

**Rate limiting:** max 1 request per sender→recipient pair per 24h (checked against existing notifications table before inserting).

---

### Step 8 — Event attendees: show collaboration types + Collaborate button

**File:** `app/events/[id]/page.tsx`

On the event detail page, in the existing attendees/RSVP list, show each attendee's collaboration type pills alongside their name. Add a "Collaborate" button next to each attendee (reuses `CollabRequestButton` from Step 6).

This surfaces collaborators you'll physically meet at the event — the strongest signal for a successful collaboration.

---

### Step 7 — QR Card: include collaboration types

**File:** `components/qr/UserProfileQRCard.tsx`

- In `generateQRData()`, add `collaborationTypes` to the `data` object alongside existing `skills`
- In `UserProfileQRCardContent`, add collaboration type pills below the skills row (if present, hidden on "small" layout)

---

## Files to modify

| File                                  | Change                                                              |
| ------------------------------------- | ------------------------------------------------------------------- |
| `prisma/schema.prisma`                | Add `collaborationTypes String[]` to MusicianProfile                |
| `app/api/musicians/route.ts`          | Add search / collabType / availableForCollab filter params          |
| `app/profile/[address]/edit/page.tsx` | Add collaboration types multi-select section                        |
| `app/profile/[address]/page.tsx`      | Show collab type pills + CollabRequestButton                        |
| `app/musicians/page.tsx`              | Add search input + filter chips                                     |
| `components/qr/UserProfileQRCard.tsx` | Include collaborationTypes in QR data and card display              |
| `app/events/[id]/page.tsx`            | Show attendee collaboration types + Collaborate button in RSVP list |

## New files

| File                                         | Purpose                                                              |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `components/profile/CollabRequestButton.tsx` | Button + modal for sending a collaboration request                   |
| `app/api/collaborate/route.ts`               | POST endpoint — validates, rate-limits, creates notification         |
| `constants/musicOptions.ts`                  | Canonical lists for styles, genres, instruments, collaboration types |

---

## Verification

1. Add `collaborationTypes` on your own profile edit page → save → confirm pills appear on profile view
2. Visit `/musicians` → search by name → confirm filtered results
3. Filter by "Lyrics" chip → only musicians with LYRICS in their collaborationTypes shown
4. Visit another CM's profile → click "Collaborate" → type a note → send → check recipient's notification bell shows the request with a link back to the sender's profile
5. Scan a musician's QR code when they have collaboration types set → confirm types appear on the card
