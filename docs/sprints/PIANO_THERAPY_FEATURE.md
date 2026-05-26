# Piano Therapy Infrastructure Plan

## Context

The blog owner has been reading Norman Doidge's "The Brain that Changes Itself" and wants
GPN to serve the piano therapy community. Three workstreams: a dedicated landing page for
the topic, venue tagging for therapy-accessible spaces, and therapist identification in
the musicians directory. No content is ready yet — this is infrastructure only.

---

## Workstream 1 — Piano Therapy Landing Page

**New file:** `app/piano-therapy/page.tsx`

A static server component that:

- Hero section: brief intro to piano therapy and neuroplasticity (placeholder text, user will fill in)
- "Why Piano?" section: reference to Doidge's work and brain plasticity (placeholder)
- **Blog posts**: filters `allBlogs` from Contentlayer for posts tagged `piano-therapy`; renders as a simple card grid
- **Therapy venues** call-to-action: link to `/venues?tag=piano-therapy`
- **Piano therapists** call-to-action: link to `/musicians?collabType=PIANO_THERAPY`

**Navigation:** Add entry to `data/headerNavLinks.ts` under the Community dropdown:

```ts
{ href: '/piano-therapy', title: 'Piano Therapy' }
```

---

## Workstream 2 — Therapy Venue Tagging

**No schema change needed** — the `Venue.tags: String[]` field already exists.

### 2a. Venue submission form — `app/submit/page.tsx`

Add a checkbox below the existing fields:

```
☐ This is a piano therapy venue (care home, rehab centre, music therapy studio, etc.)
```

When checked, adds `"piano-therapy"` to the `tags` array before submitting.

### 2b. Venue edit form — `components/VenueEditForm.tsx`

Same checkbox, reading initial value from `venue.tags.includes('piano-therapy')`.

### 2c. Venues directory — `app/venues/page.tsx`

- Add a **"🎹 Therapy Venues"** filter chip alongside existing filters
- When active, passes `tag=piano-therapy` as a query param to the API
- Update `app/api/venues/route.ts` GET handler to support the `tag` param:
  ```ts
  if (tag) where.tags = { has: tag }
  ```

### 2d. Venue cards / detail pages

Add a small **"Piano Therapy Venue"** badge (green pill) when `tags.includes('piano-therapy')`.

---

## Workstream 3 — Therapist Identification in Musicians Directory

**No schema change needed** — `MusicianProfile.collaborationTypes: String[]` stores arbitrary strings.

### 3a. Add `PIANO_THERAPY` to collab type constants

In both profile pages, add to the `COLLAB_TYPES` array:

```ts
{ value: 'PIANO_THERAPY', label: 'Piano Therapy' }
```

- `app/profile/setup/page.tsx`
- `app/profile/[address]/edit/page.tsx`

### 3b. Musicians directory filter — `app/musicians/page.tsx`

Add **"Piano Therapist"** as a selectable collab-type filter chip.
The existing API already handles `collaborationTypes: { hasEvery: collabTypes }` — no API change needed.

### 3c. Musician profile display — `app/profile/[address]/page.tsx`

When `musicianProfile.collaborationTypes.includes('PIANO_THERAPY')`, show a
**"🎹 Piano Therapist"** badge on their profile.

---

## Files to change

| File                                  | Change                                         |
| ------------------------------------- | ---------------------------------------------- |
| `app/piano-therapy/page.tsx`          | **New** — landing page                         |
| `data/headerNavLinks.ts`              | Add Piano Therapy nav entry under Community    |
| `app/submit/page.tsx`                 | Add therapy venue checkbox                     |
| `components/VenueEditForm.tsx`        | Add therapy venue checkbox                     |
| `app/venues/page.tsx`                 | Add therapy filter chip + badge on venue cards |
| `app/api/venues/route.ts`             | Support `tag` query param filter               |
| `app/profile/setup/page.tsx`          | Add PIANO_THERAPY collab type option           |
| `app/profile/[address]/edit/page.tsx` | Add PIANO_THERAPY collab type option           |
| `app/musicians/page.tsx`              | Add Piano Therapist filter chip                |
| `app/profile/[address]/page.tsx`      | Show Piano Therapist badge                     |

---

## Verification

1. `/piano-therapy` loads with placeholder content; shows empty posts section until articles are tagged
2. "Piano Therapy" link appears in the Community nav dropdown
3. `/submit` — therapy checkbox is visible; checking it and submitting saves `"piano-therapy"` in tags
4. `/venues` — "Therapy Venues" chip appears; toggling shows only tagged venues; tagged venues show the badge
5. Venue detail page shows badge when tagged
6. Profile setup and edit — "Piano Therapy" appears in collab types list
7. `/musicians` — "Piano Therapist" filter chip works correctly
8. Musician profile shows the badge when `PIANO_THERAPY` is in their collab types
