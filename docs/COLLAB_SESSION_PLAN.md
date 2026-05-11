# Collaboration Session Threads — Implementation Plan

## Background & Goal

Musicians can currently send a one-way collaboration request (max 200 chars) that lands as a bell notification linking to the sender's profile. There is no way to reply, see history, or save the conversation.

The goal is to turn that initial request into a persistent two-person thread:

- Either person can add messages
- Either person can save the session
- A `/messages` page gives a full inbox view
- The bell notification links directly to the thread

---

## 1. Database Schema

Add two new models to `prisma/schema.prisma`.

### CollabSession

```prisma
model CollabSession {
  id                Int             @id @default(autoincrement())
  creator           User            @relation("CollabSessionsAsCreator",   fields: [creatorId],   references: [id], onDelete: Cascade)
  creatorId         Int
  recipient         User            @relation("CollabSessionsAsRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  recipientId       Int
  savedByCreator    Boolean         @default(false)
  savedByRecipient  Boolean         @default(false)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  messages          CollabMessage[]

  @@unique([creatorId, recipientId])
  @@index([creatorId])
  @@index([recipientId])
}
```

### CollabMessage

```prisma
model CollabMessage {
  id        Int           @id @default(autoincrement())
  session   CollabSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId Int
  sender    User          @relation("SentCollabMessages", fields: [senderId], references: [id], onDelete: Cascade)
  senderId  Int
  body      String        @db.VarChar(500)
  createdAt DateTime      @default(now())

  @@index([sessionId, createdAt])
  @@index([senderId])
}
```

### User model additions (back-relations only, no new columns)

```prisma
  collabSessionsAsCreator   CollabSession[] @relation("CollabSessionsAsCreator")
  collabSessionsAsRecipient CollabSession[] @relation("CollabSessionsAsRecipient")
  sentCollabMessages        CollabMessage[] @relation("SentCollabMessages")
```

---

## 2. Migration

**File:** `prisma/migrations/20260508001000_add_collab_session/migration.sql`

```sql
CREATE TABLE "CollabSession" (
    "id"               SERIAL NOT NULL,
    "creatorId"        INTEGER NOT NULL,
    "recipientId"      INTEGER NOT NULL,
    "savedByCreator"   BOOLEAN NOT NULL DEFAULT false,
    "savedByRecipient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CollabSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollabMessage" (
    "id"        SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "senderId"  INTEGER NOT NULL,
    "body"      VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollabMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollabSession_creatorId_recipientId_key" ON "CollabSession"("creatorId", "recipientId");
CREATE INDEX "CollabSession_creatorId_idx"           ON "CollabSession"("creatorId");
CREATE INDEX "CollabSession_recipientId_idx"         ON "CollabSession"("recipientId");
CREATE INDEX "CollabMessage_sessionId_createdAt_idx" ON "CollabMessage"("sessionId", "createdAt");
CREATE INDEX "CollabMessage_senderId_idx"            ON "CollabMessage"("senderId");

ALTER TABLE "CollabSession" ADD CONSTRAINT "CollabSession_creatorId_fkey"
    FOREIGN KEY ("creatorId")   REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollabSession" ADD CONSTRAINT "CollabSession_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollabMessage" ADD CONSTRAINT "CollabMessage_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "CollabSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollabMessage" ADD CONSTRAINT "CollabMessage_senderId_fkey"
    FOREIGN KEY ("senderId")  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollabSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CollabMessage" ENABLE ROW LEVEL SECURITY;
```

---

## 3. API Routes

### Modify existing: `app/api/collaborate/route.ts`

- Wrap three writes in `db.$transaction`: create `CollabSession` → create first `CollabMessage` → create `Notification`
- If a session already exists between the pair (check both orderings), add a new message + notification to the existing session instead of creating a second one
- Change `notification.link` from `/profile/${sender.walletAddress}` to `/messages/${session.id}`
- Update rate-limit check to query `CollabSession` for an existing pair rather than querying `Notification.link`
- Add `sessionId` to JSON response so the button can show an "Open conversation" link

### New: `GET /api/messages`

`app/api/messages/route.ts`
Returns all sessions where current user is creator or recipient, ordered by `updatedAt` desc. Includes other participant's profile summary and last message snippet.

### New: `GET /api/messages/[id]` and `PATCH /api/messages/[id]`

`app/api/messages/[id]/route.ts`

- **GET**: Full session with all messages (ASC order), both participant profiles. Returns 403 if requester is not a participant.
- **PATCH** `{ saved: boolean }`: Toggles `savedByCreator` or `savedByRecipient` for the calling user.

### New: `POST /api/messages/[id]/reply`

`app/api/messages/[id]/reply/route.ts`
Body: `{ body: string (1–500 chars) }`. Appends a `CollabMessage`, bumps `CollabSession.updatedAt`, creates a `COLLABORATION_MESSAGE` notification for the other participant linking to `/messages/${id}`.

---

## 4. Pages

### `/messages` — Inbox list

`app/messages/page.tsx`

- Lists all sessions (as creator or recipient), ordered by last activity
- Each card: other user's avatar + name, last message preview (~80 chars), relative timestamp, "Saved" badge if applicable
- Empty state: "No conversations yet."
- Each card links to `/messages/[id]`

### `/messages/[id]` — Thread view

`app/messages/[id]/page.tsx`

- Header: other user's name + avatar + link to their profile
- Scrollable message thread: own messages on the right (teal), other person on the left (gray)
- Reply textarea (max 500 chars) + character counter + Send button
- Optimistic append: new message appears immediately on send
- "Save conversation" toggle → `PATCH /api/messages/[id]`
- Back link: "← Messages"
- 403 guard: "You don't have access to this conversation"

---

## 5. Component Changes

### `components/notifications/NotificationBell.tsx`

Add two icon cases — no structural change:

```typescript
case 'COLLABORATION_REQUEST': return '🤝'
case 'COLLABORATION_MESSAGE': return '💬'
```

### `components/profile/CollabRequestButton.tsx`

- Add optional `recipientId?: number` prop; include in POST body
- After successful send: show existing "Request sent!" text plus `<Link href={/messages/${sessionId}}>Open conversation →</Link>`

### `app/profile/[address]/page.tsx`

Add `recipientId={profile.id}` to `<CollabRequestButton>`.

### New: `components/messages/MessageBubble.tsx`

Single message bubble. Props: `body, senderName, senderAvatar, isOwn, createdAt`.

### New: `components/messages/SessionCard.tsx`

Session row for the `/messages` inbox list.

### `components/Header.tsx`

Add "Messages" nav link.

---

## 6. Implementation Order

| Step | What                                       | Risk                           |
| ---- | ------------------------------------------ | ------------------------------ |
| 1    | Schema + migration file                    | None — new tables only         |
| 2    | `npx prisma generate`                      | None                           |
| 3    | New `/api/messages/*` routes               | None — new routes              |
| 4    | Modify `POST /api/collaborate`             | Medium — existing flow changes |
| 5    | Update `CollabRequestButton`               | Low — additive                 |
| 6    | Update profile page                        | Low — one prop                 |
| 7    | New `/messages` and `/messages/[id]` pages | None — new routes              |
| 8    | NotificationBell icon update               | None — cosmetic                |
| 9    | Add "Messages" nav link                    | None — additive                |

---

## 7. Verification Checklist

- [ ] Send a collab request: `CollabSession` + `CollabMessage` rows created, notification links to `/messages/[id]`
- [ ] Recipient opens bell → clicks notification → lands on thread page
- [ ] Recipient replies → new `CollabMessage` row, sender gets bell notification
- [ ] "Save conversation" toggles the correct `savedByCreator`/`savedByRecipient` field
- [ ] `/messages` page lists the session for both users
- [ ] "Open conversation" link appears in `CollabRequestButton` after sending
- [ ] Second collab request between same pair routes to existing session (no duplicate)
- [ ] Old notifications (pre-feature) still link correctly to profiles

---

## Notes / Open Questions

- Message character limit: 200 chars for the opening request, 500 chars for replies. Adjust if needed.
- The `@@unique([creatorId, recipientId])` constraint is directional. Duplicate-session prevention is handled in application code by checking both orderings.
- "Clear all" in the notification bell is unaffected — it only deletes `Notification` rows, not `CollabSession`/`CollabMessage` rows. Sessions persist regardless.
