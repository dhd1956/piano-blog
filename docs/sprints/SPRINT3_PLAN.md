# Sprint 3 - Planning Document

**Created:** December 31, 2025
**Updated:** December 31, 2025
**Status:** 🚀 IN PROGRESS
**Started:** December 31, 2025
**Estimated Duration:** 2-3 weeks

---

## Sprint 3 Overview

Sprint 3 focuses on **completing carryover items from Sprint 2** and **enhancing user experience** with notification systems, improved workflows, and refined musician profiles.

**Key Themes:**

1. Complete PXP rewards auto-distribution
2. Enhance musician profiles with detailed fields
3. Improve venue rejection workflows
4. Build notification infrastructure

---

## Current Progress (Dec 31, 2025)

**Sprint Status:** 🟡 20% Complete (2 of 10 stories)

### Completed Stories ✅

- **Story 1.1:** New User Welcome Reward (Backend)
- **Story 1.2:** Scout Reward on Venue Verification (Backend)

### In Progress 🔄

- None currently

### Pending ⏸️

- **Story 1.3:** Pending Rewards Notification UI (Frontend)
- **Epic 2:** Enhanced Musician Profiles (All stories)
- **Epic 3:** Venue Rejection Workflow (All stories)
- **Epic 4:** Notification Infrastructure (All stories)

### Key Achievements

- ✅ New wallet users automatically receive 100 PXP welcome reward
- ✅ Scouts receive 75 PXP when submitted venues are verified
- ✅ All rewards configurable via PXPConfig database table
- ✅ 17 PXP earning actions now defined in system
- ✅ Database tracks first PXP earned to prevent double-claiming

### Technical Debt / Frontend TODOs

- Celebration toast when user earns welcome reward
- Notification UI when venue is verified
- Real-time PXP balance updates in UI
- Notification infrastructure (Epic 4 prerequisite)

---

## Sprint 3 Goals

### Primary Goals (Must Have)

1. ✅ **PXP Rewards Auto-Distribution** - Complete from Sprint 2
   - Automatic reward triggers
   - Pending rewards notification UI
   - Scout reward on venue verification
   - New user welcome reward

2. ✅ **Enhanced Musician Profiles** - Complete from Sprint 2
   - Instrument selection
   - Genre tags
   - Experience level
   - Availability status
   - Performance portfolio links

3. ✅ **Venue Rejection Workflow** - Critical UX improvement
   - Scout notification system
   - Filter rejected venues from public
   - My Submissions dashboard

### Secondary Goals (Should Have)

4. ✅ **Notification Infrastructure**
   - In-app notification system
   - Email notifications
   - Notification preferences
   - Real-time updates

5. ✅ **Scout Dashboard**
   - Submission tracking
   - Status visualization
   - Earnings history
   - Performance metrics

### Nice to Have (Could Have)

6. 🔵 **Reward History Page**
   - Transaction history
   - Reward breakdown
   - Analytics dashboard
   - Export functionality

7. 🔵 **Profile Enhancements**
   - Profile completeness indicator
   - Achievement badges
   - Social proof elements

---

## Sprint 3 Stories & Tasks

### Epic 1: PXP Rewards Auto-Distribution

**Goal:** Users automatically receive PXP rewards when triggering events occur

#### Story 1.1: New User Welcome Reward ✅ COMPLETE

**As a** new user connecting my wallet
**I want to** automatically receive a welcome reward
**So that** I'm incentivized to engage with the platform

**Acceptance Criteria:**

- [x] First-time wallet connection triggers 100 PXP reward
- [x] Database flag prevents double-claiming (firstPXPEarnedAt check)
- [ ] Notification shows reward earned (frontend TODO)
- [ ] Balance updates in real-time (frontend TODO)

**Implementation:**

- ✅ Hook into wallet connection flow (login route)
- ✅ Call PXP config to get reward amount (wallet_connection key)
- ✅ Update user's totalPXPEarned
- ⏸️ Create notification record (Epic 4)
- ⏸️ Show celebration toast (frontend TODO)

**Effort:** 1 day
**Completed:** December 31, 2025
**Commit:** 001bc7b

---

#### Story 1.2: Scout Reward on Venue Verification ✅ COMPLETE

**As a** scout who submitted a venue
**I want to** receive PXP when my venue is verified
**So that** I'm rewarded for quality contributions

**Acceptance Criteria:**

- [x] Scout receives configurable PXP when venue approved (75 PXP)
- [ ] Notification sent to scout (Epic 4)
- [x] Reward visible in transactions (totalCAVEarned incremented)
- [x] Works for both wallet and email users

**Implementation:**

- ✅ Update venue verification endpoint (PUT /api/venues/[id])
- ✅ Fetch scout reward from PXPConfig (venue_verified key)
- ✅ Award PXP to submitter (find by submittedBy wallet)
- ⏸️ Create notification (Epic 4)
- ⏸️ Send email notification (Epic 4)

**Effort:** 1 day
**Completed:** December 31, 2025
**Commit:** d61ed2e

---

#### Story 1.3: Pending Rewards Notification UI

**As a** user with pending rewards
**I want to** see a notification badge
**So that** I know I have rewards to claim

**Acceptance Criteria:**

- [ ] Badge shows number of pending rewards
- [ ] Clicking shows reward details
- [ ] One-click claim functionality
- [ ] Balance updates immediately

**Implementation:**

- Create PendingRewardsNotification component
- Build /api/rewards/pending endpoint
- Add notification badge to header
- Implement claim functionality

**Effort:** 1 day

**Total Epic 1 Effort:** 3 days

---

### Epic 2: Enhanced Musician Profiles

**Goal:** Musicians can showcase their skills, experience, and availability

#### Story 2.1: Database Schema for Musician Fields

**As a** developer
**I want to** add musician-specific fields to the User model
**So that** musicians can provide detailed information

**Acceptance Criteria:**

- [ ] Migration adds new fields without data loss
- [ ] Existing users unaffected
- [ ] Fields are optional (nullable)

**Fields to Add:**

```prisma
instruments       String[]   // Multi-select
genres           String[]   // Multi-select
experienceLevel  String?    // Dropdown
availability     String?    // Status toggle
performanceLinks Json?      // Social proof
repertoire       String?    // Free text
```

**Effort:** 0.5 days

---

#### Story 2.2: Profile Edit Form Enhancement

**As a** musician
**I want to** edit my profile with detailed musical information
**So that** other users can discover my skills

**Acceptance Criteria:**

- [ ] All new fields appear in edit form
- [ ] Multi-select works for instruments/genres
- [ ] Form validation prevents invalid data
- [ ] Save updates database correctly

**Implementation:**

- Add MultiSelect components
- Add dropdown for experience
- Add radio group for availability
- Add URL inputs for performance links
- Add textarea for repertoire

**Effort:** 1 day

---

#### Story 2.3: Profile Display Enhancement

**As a** user viewing a musician profile
**I want to** see their instruments, genres, and experience
**So that** I can find suitable collaborators

**Acceptance Criteria:**

- [ ] All musician fields display on profile
- [ ] Empty fields hidden
- [ ] Links are clickable
- [ ] Styling matches existing design

**Implementation:**

- Update profile page template
- Add badges for instruments/genres
- Add experience badge
- Add availability indicator
- Display performance links

**Effort:** 1 day

**Total Epic 2 Effort:** 2.5 days

---

### Epic 3: Venue Rejection Workflow

**Goal:** Scouts receive clear feedback when venues are rejected

#### Story 3.1: Scout Notification on Rejection

**As a** scout whose venue was rejected
**I want to** receive a notification with the reason
**So that** I understand what went wrong

**Acceptance Criteria:**

- [ ] Notification created when venue rejected
- [ ] Email sent to scout
- [ ] Rejection reason included
- [ ] Link to venue details provided

**Implementation:**

- Update venue rejection endpoint
- Create notification record
- Send email notification
- Include curator feedback

**Effort:** 0.5 days

---

#### Story 3.2: Filter Rejected Venues from Public

**As a** user browsing venues
**I want to** see only verified/pending venues
**So that** I don't see rejected submissions

**Acceptance Criteria:**

- [ ] Public venue list excludes rejected
- [ ] Curator view shows rejected venues
- [ ] Filter parameter to include rejected
- [ ] Count shows accurate numbers

**Implementation:**

- Update getVenues query
- Add default filter for public views
- Update curator page to include rejected
- Update venue counts

**Effort:** 0.5 days

---

#### Story 3.3: My Submissions Dashboard

**As a** scout
**I want to** see all my venue submissions
**So that** I can track their status

**Acceptance Criteria:**

- [ ] Shows all user's submissions
- [ ] Grouped by status (pending/verified/rejected)
- [ ] Color-coded status badges
- [ ] Links to venue details
- [ ] Shows PXP earned from verified venues

**Implementation:**

- Create /my-submissions page
- Build API endpoint for user venues
- Display submissions in table/cards
- Add filters and sorting

**Effort:** 1 day

**Total Epic 3 Effort:** 2 days

---

### Epic 4: Notification Infrastructure

**Goal:** Unified notification system for all platform events

#### Story 4.1: Notification Database Model

**As a** developer
**I want to** store notifications in the database
**So that** users can view notification history

**Schema:**

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      NotificationType // REWARD_EARNED, VENUE_VERIFIED, VENUE_REJECTED, etc.
  title     String
  message   String   @db.Text
  link      String?  // Link to related resource

  read      Boolean  @default(false)
  readAt    DateTime?

  createdAt DateTime @default(now())
}

enum NotificationType {
  REWARD_EARNED
  VENUE_VERIFIED
  VENUE_REJECTED
  EVENT_REMINDER
  RSVP_CONFIRMED
  PROFILE_VIEWED
}
```

**Effort:** 0.5 days

---

#### Story 4.2: In-App Notification Component

**As a** user
**I want to** see notifications in a dropdown
**So that** I stay informed of platform activity

**Acceptance Criteria:**

- [ ] Bell icon shows unread count
- [ ] Dropdown shows recent notifications
- [ ] Mark as read functionality
- [ ] Link to notification page
- [ ] Real-time updates

**Implementation:**

- Create NotificationDropdown component
- Build /api/notifications endpoint
- Add notification bell to header
- Implement mark-as-read
- Add real-time polling

**Effort:** 1 day

---

#### Story 4.3: Notification Preferences

**As a** user
**I want to** control which notifications I receive
**So that** I'm not overwhelmed

**Acceptance Criteria:**

- [ ] Toggle email notifications per type
- [ ] Toggle in-app notifications per type
- [ ] Saved preferences persist
- [ ] Defaults are sensible

**Implementation:**

- Add preferences to User model
- Create preferences page
- Update notification logic
- Respect user preferences

**Effort:** 0.5 days

**Total Epic 4 Effort:** 2 days

---

## Sprint 3 Timeline

**Total Estimated Effort:** 9.5 days

### Week 1 (Days 1-5): Core Features

- **Day 1:** PXP Auto-Distribution (Story 1.1, 1.2)
- **Day 2:** Pending Rewards UI (Story 1.3)
- **Day 3:** Musician Profile Schema + Edit Form (Story 2.1, 2.2)
- **Day 4:** Musician Profile Display (Story 2.3)
- **Day 5:** Venue Rejection Workflow (Epic 3)

### Week 2 (Days 6-10): Notifications & Polish

- **Day 6:** Notification Database (Story 4.1)
- **Day 7:** In-App Notifications (Story 4.2)
- **Day 8:** Notification Preferences (Story 4.3)
- **Day 9:** Testing & Bug Fixes
- **Day 10:** Documentation & Deployment

---

## Success Metrics

Sprint 3 will be considered **100% complete** when:

### Feature Metrics

- ✅ New users automatically receive welcome reward
- ✅ Scouts receive PXP when venues verified
- ✅ Pending rewards visible in notification center
- ✅ Musician profiles show instruments, genres, experience
- ✅ Rejected venues filtered from public listings
- ✅ Scouts can view submission status dashboard
- ✅ Notifications appear in-app and via email

### Technical Metrics

- ✅ All API endpoints tested
- ✅ Database migrations run successfully
- ✅ No breaking changes to existing features
- ✅ Responsive design on mobile/tablet
- ✅ Accessibility standards met

### User Metrics

- 📊 80%+ of new users claim welcome reward
- 📊 50%+ of scouts view My Submissions
- 📊 60%+ of users configure notification preferences

---

## Dependencies & Risks

### Dependencies

- ✅ PXP configuration system (completed in Sprint 2)
- ✅ Email service (already implemented)
- ✅ Database schema supports JSON fields

### Risks

| Risk                              | Impact | Mitigation                                         |
| --------------------------------- | ------ | -------------------------------------------------- |
| Email delivery issues             | Medium | Use reliable email service (already configured)    |
| Real-time notification complexity | Medium | Start with polling, upgrade to WebSockets later    |
| Schema migration failures         | High   | Test migrations on staging first                   |
| PXP contract gas fees             | Low    | Use database-tracked rewards (already implemented) |

---

## Deferred to Future Sprints

### Sprint 4 Candidates

1. **Democratic Verification System**
   - Multi-verifier consensus
   - Voting workflow
   - Effort: 5-7 days
   - **Reason for deferral:** Current system adequate, low ROI

2. **Reward History & Analytics**
   - Transaction history page
   - Reward leaderboard
   - Scout statistics
   - Effort: 3-4 days

3. **Gas Sponsorship** (Quick Win)
   - Sponsor gas fees for users
   - Effort: 2-3 days
   - Cost: ~$25-30/month for 100 users
   - **High impact on UX**

4. **Audio Upload System**
   - Performance audio clips
   - Streaming integration
   - Effort: 5-7 days

5. **Social Features**
   - Follow/unfollow musicians
   - Activity feed
   - Messaging system
   - Effort: 7-10 days

---

## Out of Scope for Sprint 3

- Smart contract modifications
- Blockchain voting mechanisms
- Audio/video streaming features
- Mobile app development
- Advanced analytics dashboards

---

## Definition of Done

A story is considered "Done" when:

1. ✅ Code implemented and tested
2. ✅ Unit tests pass
3. ✅ API documented
4. ✅ UI/UX reviewed
5. ✅ Accessibility checked
6. ✅ Deployed to staging
7. ✅ User acceptance criteria met
8. ✅ Documentation updated

---

## Next Steps

1. **Review Sprint 3 Plan** - Team approval
2. **Create Feature Branches** - One per epic
3. **Set Up Sprint Board** - Track progress
4. **Daily Standups** - Stay aligned
5. **Sprint Review** - Demo to stakeholders
6. **Sprint Retrospective** - Continuous improvement

---

**Document Status:** Draft
**Last Updated:** December 31, 2025
**Owner:** Development Team
**Approver:** Product Owner
