# Groups Feature Plan

## Context

Add a Groups feature to Global Piano Network. Groups are flexible communities (social,
organiser teams, venue regulars, etc.) created by curators or the blog owner. Membership
is invite-only — the group owner adds members directly. A group can link to 0, 1, or many
venues. Venues can be virtual (new `isVirtual` flag added to Venue model).

---

## Schema changes — `prisma/schema.prisma`

### 1. Add `isVirtual` to Venue model

```prisma
isVirtual    Boolean  @default(false)  // Online-only venue
```

Also add reverse relation to Venue:

```prisma
groups       GroupVenue[]
```

### 2. Add reverse relations to User model

```prisma
ownedGroups       Group[]       @relation("GroupOwner")
groupMemberships  GroupMember[] @relation("GroupMemberUser")
groupMembersAdded GroupMember[] @relation("GroupMemberAddedBy")
groupVenuesAdded  GroupVenue[]  @relation("GroupVenueAddedBy")
```

### 3. New models (append to schema)

```prisma
model Group {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  name        String
  description String?  @db.Text
  avatar      String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ownerId     Int
  owner       User         @relation("GroupOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     GroupMember[]
  venues      GroupVenue[]

  @@index([ownerId])
  @@index([isActive])
}

model GroupMember {
  groupId   Int
  userId    Int
  addedAt   DateTime @default(now())
  addedBy   Int

  group       Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user        User  @relation("GroupMemberUser", fields: [userId], references: [id], onDelete: Cascade)
  addedByUser User  @relation("GroupMemberAddedBy", fields: [addedBy], references: [id])

  @@id([groupId, userId])
  @@index([userId])
}

model GroupVenue {
  groupId   Int
  venueId   Int
  addedAt   DateTime @default(now())
  addedBy   Int

  group       Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  venue       Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)
  addedByUser User  @relation("GroupVenueAddedBy", fields: [addedBy], references: [id])

  @@id([groupId, venueId])
  @@index([venueId])
}
```

---

## Database migration

Run `npx prisma migrate dev --name add_groups` or generate SQL and apply via Supabase SQL editor.

---

## API routes

### `/app/api/groups/route.ts`

- `GET` — list active groups with member count, venue count, owner name. Supports `?search=`, `?venueId=`, `?page=`, `?limit=`.
- `POST` — create group. Requires CURATOR or BLOG_OWNER. Auto-generates slug from name. Body: `{ name, description?, avatar? }`.

### `/app/api/groups/[slug]/route.ts`

- `GET` — full group detail: members (with user info), venues (with venue info), owner.
- `PUT` — update name/description/avatar. Requires group owner or BLOG_OWNER.
- `DELETE` — soft-delete (`isActive: false`). Requires group owner or BLOG_OWNER.

### `/app/api/groups/[slug]/members/route.ts`

- `POST` — add a member. Body: `{ userIdentifier }` (username, email, or walletAddress). Requires group owner or BLOG_OWNER.
- `DELETE` — remove a member. Body: `{ userId }`. Requires group owner or BLOG_OWNER.

### `/app/api/groups/[slug]/venues/route.ts`

- `POST` — link a venue. Body: `{ venueId }`. Requires group owner or BLOG_OWNER.
- `DELETE` — unlink a venue. Body: `{ venueId }`. Requires group owner or BLOG_OWNER.

---

## UI pages

### `/app/groups/page.tsx` — Group listing

- Grid of group cards: avatar, name, description snippet, member count, venue count.
- Search bar + optional venue filter.
- "Create Group" button visible to CURATOR and BLOG_OWNER.
- Public read access.

### `/app/groups/[slug]/page.tsx` — Group detail

- Header: avatar, name, description, owner.
- Members list: avatar, displayName, link to profile.
- Linked venues list: venue name, city, Virtual badge if `isVirtual`.
- Owner/blog-owner sees "Manage" controls (add/remove members, add/remove venues).

### `/app/groups/create/page.tsx` — Create/edit form

- Fields: name (auto-generates slug preview), description, avatar URL.
- Accessible to CURATOR and BLOG_OWNER via `useRole()` guard.
- Redirects to `/groups/[slug]` on success.

### `/app/admin/groups/page.tsx` — Admin management

- Table of all groups (including inactive) with owner, member count, venue count.
- Inline expandable panels for venue assignment and member management.
- Pattern mirrors `/app/admin/users/page.tsx`.
- BLOG_OWNER only.

---

## Navigation

Add to `data/headerNavLinks.ts`:

```ts
{ href: '/groups', title: 'Groups' }
```

---

## Existing utilities to reuse

- `lib/auth-middleware.ts` — `requireRole`, `authenticate` for all API routes
- `hooks/useRole.ts` — `isBlogOwner`, `isCurator` for UI guards
- `hooks/useRequireAuth.ts` — auth guard on create/admin pages
- Slug generation: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`
- Pagination response shape: `{ groups[], pagination: { page, limit, totalCount, totalPages, hasMore } }`

---

## Verification

1. Blog owner: go to `/admin/groups` — create a group, add Mal as a member, link a venue.
2. Mal (curator): go to `/groups` — confirm she can see the group.
3. Visit `/groups/[slug]` — confirm members and venues display correctly.
4. Go to `/groups/create` as curator — confirm form accessible and creates a group.
5. Go to `/groups/create` as validator/scout — confirm access denied.
6. Link a virtual venue — confirm Virtual badge shows on group detail page.

---

## Status

- [ ] Schema + migration
- [ ] API: GET/POST /api/groups
- [ ] API: GET/PUT/DELETE /api/groups/[slug]
- [ ] API: POST/DELETE /api/groups/[slug]/members
- [ ] API: POST/DELETE /api/groups/[slug]/venues
- [ ] UI: /groups listing page
- [ ] UI: /groups/[slug] detail page
- [ ] UI: /groups/create form
- [ ] UI: /admin/groups management page
- [ ] Navigation link
