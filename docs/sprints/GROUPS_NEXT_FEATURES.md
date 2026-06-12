# Groups — Use Cases & Next Features

## Context

Groups launched as invite-only communities (owner-managed, linked to verified venues). The user wants to understand the full value proposition and identify what to build next: band formation, audience building, group RSVP, and group messaging (WhatsApp-style). This plan maps the design space and proposes discrete features in priority order.

---

## What Groups Already Deliver (no new code needed)

| Use case              | How                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Form a band**       | Create a group, add your musicians as members, link your home venue(s). The group page IS your band's public profile. |
| **Form an audience**  | A curator creates a "Fans of X" or "Thursday Night Regulars" group and adds community members.                        |
| **Venue regulars**    | Link the group to a venue — the group page shows who hangs out there.                                                 |
| **Virtual ensembles** | Create a group with `isVirtual` venues (or no venues).                                                                |

---

## Venue Tie-In: Helps vs. Hinders

**Helps:**

- A band group linked to their residency venue → their gigs at that venue auto-surface on the group page (if we join events to group venues)
- "Notify group members of events at linked venues" becomes a natural feature
- Audience groups can follow a venue ("I want to know everything happening at The Rex")

**Hinders:**

- Touring bands need to link many venues — friction
- Online-only groups (remote jam projects, composition teams) get no value from venue links
- Linking is currently manual and venue-ID-based — needs the dropdown UX (done)

**Verdict:** Venue links are additive, not required. The `isVirtual` flag and zero-venue groups already handle the non-venue case cleanly.

---

## Four Features to Build

### Feature 1 — Group Messaging (WhatsApp-style chat)

**The ask:** Members can send messages to the whole group, not just 1:1.

**Design:**

- New model `GroupMessage { id, groupId, senderId, body, createdAt }`
- API: `GET/POST /api/groups/[slug]/messages` (members only)
- UI: Thread on the group detail page, below members/venues. Auto-polls or uses SWR.
- Notifications: fire `GROUP_MESSAGE` notification to all other members

**This is the highest-value unlock** — it's what makes a group feel alive rather than a static list.

---

### Feature 2 — Group RSVP / Event Invites

**The ask:** RSVP to an event as a group, or invite the whole group to an event.

**Two sub-features (can ship independently):**

**2a. Group invite to event (organizer side)**

- On the event detail/edit page, organizer picks a group → all members get an in-app notification with a direct RSVP link
- No schema change needed; just a new API endpoint `POST /api/events/[id]/invite-group` that loops through GroupMember and fires notifications
- Members still RSVP individually (their own `EventRSVP` row)

**2b. Group RSVP (member side)**

- On the event RSVP UI, a member sees a "Bring my group" option
- Sends individual RSVP invites to all group members on their behalf
- Same mechanism as 2a but initiated by a member, not the organizer

**Recommendation: ship 2a first** — organizer-driven is simpler and immediately useful for bands promoting their gigs to their audience groups.

---

### Feature 3 — Group-Organised Events

**The ask:** A band group can create events that appear on their group page.

**Design:**

- Add optional `groupId` to Event model (nullable FK → Group)
- Group owner can create events on behalf of the group (bypasses the CURATOR-only restriction if the group owner has CURATOR role)
- Group detail page shows an "Upcoming Events" section (events where `groupId = this group`)
- This is the "band gigs page" use case

**Dependency:** Requires a small schema migration (`ALTER TABLE "Event" ADD COLUMN "groupId" INT REFERENCES "Group"("id") ON DELETE SET NULL`).

---

### Feature 4 — Event-Linked Venue Notifications

**The ask:** Members of a group linked to a venue get notified when a new event is created at that venue.

**Design:**

- When a new event is created at venue V, find all groups linked to V, find all members of those groups, fire `EVENT_AT_YOUR_VENUE` notification
- No schema change; hook into the existing `POST /api/events` route
- Low friction, high signal for audience groups and venue regulars

---

## Recommended Build Order

1. **Group Messaging** — makes groups feel like communities, not just lists
2. **Group invite to event (2a)** — unlocks bands promoting gigs to fan groups
3. **Group-organised events (3)** — band profile pages with their own gig listings
4. **Venue notifications (4)** — ambient value, good for audience groups

---

## Files That Would Change

| Feature             | New files                                   | Modified files                                                                  |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| Group messaging     | `app/api/groups/[slug]/messages/route.ts`   | `prisma/schema.prisma`, `app/groups/[slug]/page.tsx`                            |
| Group invite        | `app/api/events/[id]/invite-group/route.ts` | `app/events/[id]/page.tsx` (organizer UI)                                       |
| Group events        | —                                           | `prisma/schema.prisma`, `app/api/events/route.ts`, `app/groups/[slug]/page.tsx` |
| Venue notifications | —                                           | `app/api/events/route.ts` (POST handler)                                        |

---

## Decisions Confirmed

| Question                         | Decision                                   |
| -------------------------------- | ------------------------------------------ |
| Who posts to group chat?         | **All members** (WhatsApp style)           |
| Who invites a group to an event? | **Event organiser only**                   |
| Who creates group events?        | **Group owner, if they hold CURATOR role** |
| Group chat visibility            | **Members only**                           |
