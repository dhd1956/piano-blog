# Sprint 2 - QA Testing Stories

**Sprint Duration:** Sprint 2
**Created:** 2025-01-30
**Status:** Ready for QA Testing

---

## Overview

This document outlines all QA testing requirements for features implemented in Sprint 2. Each story includes detailed test cases, acceptance criteria, edge cases, and regression testing requirements.

---

## Table of Contents

- [WPB-208: Events System - Directory Page](#wpb-208-events-system---directory-page)
- [WPB-209: Events System - Event Creation](#wpb-209-events-system---event-creation)
- [WPB-210: Events System - Event Detail Page](#wpb-210-events-system---event-detail-page)
- [WPB-211: Events System - RSVP Management](#wpb-211-events-system---rsvp-management)
- [WPB-212: Events System - Event Management](#wpb-212-events-system---event-management)
- [WPB-202: RBAC System Implementation](#wpb-202-rbac-system-implementation)
- [Venue Rejection Tracking](#venue-rejection-tracking)
- [Venue Enhancement Features](#venue-enhancement-features)
- [Navigation & UX Improvements](#navigation--ux-improvements)
- [Production Build Verification](#production-build-verification)

---

## WPB-208: Events System - Directory Page

**Story:** As a user, I want to view a directory of all events so I can discover upcoming music events at venues with pianos.

### Test Environment Setup

- [ ] Database seeded with test events (past, present, future)
- [ ] Test events with various statuses (DRAFT, PUBLISHED, CANCELLED)
- [ ] Events with and without RSVPs
- [ ] Events at max capacity and with available spots

### Critical Path Tests

#### TC-208-001: View Events Directory

**Priority:** P0 (Critical)

**Preconditions:**

- User navigates to `/events`
- Database contains at least 10 test events

**Test Steps:**

1. Navigate to `/events` page
2. Verify page loads without errors
3. Verify events are displayed in a list/grid format
4. Verify each event card shows:
   - Event title
   - Event date and time
   - Venue name and location
   - RSVP count / attendee count
   - "View Details" or similar CTA button
5. Verify loading state displays while fetching data
6. Verify error handling if API fails

**Expected Results:**

- Events directory loads successfully
- All event information displays correctly
- Loading and error states work properly
- Page is responsive on mobile/tablet/desktop

**Test Data:**

```javascript
{
  events: [
    {
      title: 'Jazz Night at Blue Note',
      date: '2025-02-15',
      venue: 'Blue Note Cafe',
      status: 'PUBLISHED',
    },
    {
      title: 'Classical Piano Recital',
      date: '2025-02-20',
      venue: 'Symphony Hall',
      status: 'PUBLISHED',
    },
    { title: 'Open Mic Night', date: '2025-01-15', venue: 'Coffee Shop', status: 'CANCELLED' },
  ]
}
```

---

#### TC-208-002: Filter Events by Status

**Priority:** P1 (High)

**Test Steps:**

1. Navigate to events directory
2. Verify "All", "Upcoming", "Past", "Cancelled" filter tabs exist
3. Click "Upcoming" filter
4. Verify only future events display
5. Click "Past" filter
6. Verify only past events display
7. Click "Cancelled" filter
8. Verify only cancelled events display
9. Verify active filter is visually highlighted

**Expected Results:**

- Filters work correctly for all statuses
- Event counts update per filter
- Active filter is visually distinct
- URL updates with filter parameter (if applicable)

---

#### TC-208-003: Search Events

**Priority:** P1 (High)

**Test Steps:**

1. Navigate to events directory
2. Locate search input field
3. Enter event title: "Jazz"
4. Verify results filter to matching events
5. Clear search
6. Verify all events display again
7. Search for venue name: "Blue Note"
8. Verify events at that venue display
9. Search for non-existent event: "ZZZZZ"
10. Verify "No events found" message displays

**Expected Results:**

- Search filters events in real-time
- Search works for event titles and venue names
- Empty states display appropriately
- Search is case-insensitive

---

#### TC-208-004: Sort Events

**Priority:** P2 (Medium)

**Test Steps:**

1. Navigate to events directory
2. Verify default sort is by date (ascending - soonest first)
3. Click sort dropdown
4. Select "Date (Newest First)"
5. Verify events reorder correctly
6. Select "Most Popular" (by RSVP count)
7. Verify events reorder by attendance
8. Select "Venue Name (A-Z)"
9. Verify alphabetical sorting works

**Expected Results:**

- All sort options work correctly
- Visual indicator shows active sort
- Performance is acceptable with 50+ events

---

#### TC-208-005: Pagination/Infinite Scroll

**Priority:** P2 (Medium)

**Test Steps:**

1. Create 50+ test events
2. Navigate to events directory
3. If pagination: Verify page numbers display
4. Click "Next" or scroll to bottom
5. Verify more events load
6. Verify scroll position maintains
7. Navigate to last page
8. Verify "Previous" button works

**Expected Results:**

- Pagination/infinite scroll works smoothly
- No duplicate events display
- Loading indicator shows when fetching more
- Performance remains good with many events

---

### Edge Cases & Error Scenarios

#### TC-208-006: Empty State Handling

**Test Steps:**

1. Clear all events from database
2. Navigate to `/events`
3. Verify friendly empty state message displays
4. Verify "Create Event" CTA shows (if user has permissions)

**Expected Results:**

- Empty state is user-friendly
- Provides helpful guidance or CTA

---

#### TC-208-007: API Failure Handling

**Test Steps:**

1. Simulate API failure (disconnect network or mock error)
2. Navigate to `/events`
3. Verify error message displays
4. Verify "Retry" button appears
5. Click "Retry"
6. Verify request retries

**Expected Results:**

- Error message is clear and helpful
- User can retry without page reload
- No console errors

---

#### TC-208-008: Performance Testing

**Test Steps:**

1. Seed database with 500+ events
2. Navigate to `/events`
3. Measure page load time
4. Measure filter/search response time
5. Check browser console for warnings

**Expected Results:**

- Initial load < 2 seconds
- Filter/search response < 500ms
- No memory leaks
- No performance warnings

---

### Mobile & Responsive Tests

#### TC-208-009: Mobile View Testing

**Priority:** P1 (High)

**Test Steps:**

1. Open `/events` on mobile device (or DevTools mobile view)
2. Verify layout adapts to mobile
3. Verify touch targets are appropriately sized (min 44x44px)
4. Verify filters collapse into mobile menu
5. Test search on mobile keyboard
6. Verify cards stack vertically
7. Test scrolling performance

**Expected Results:**

- Layout is fully responsive
- All features work on mobile
- Touch interactions work smoothly
- Text is readable without zooming

---

### Accessibility Tests

#### TC-208-010: Keyboard Navigation

**Priority:** P1 (High)

**Test Steps:**

1. Navigate to `/events`
2. Use Tab key to navigate through all interactive elements
3. Verify focus indicators are visible
4. Use Enter/Space to activate buttons
5. Verify skip links work (if present)
6. Test screen reader compatibility

**Expected Results:**

- All interactive elements are keyboard accessible
- Focus order is logical
- Screen readers announce content properly
- WCAG 2.1 AA compliance

---

### Regression Tests

#### TC-208-011: Navigation Integration

**Test Steps:**

1. Verify "Events" link in main navigation
2. Click link from home page
3. Verify navigation works from other pages
4. Verify back button returns to previous page
5. Verify breadcrumbs work (if present)

**Expected Results:**

- Navigation is consistent across site
- Browser history works correctly
- Active nav item is highlighted

---

## WPB-209: Events System - Event Creation

**Story:** As a musician/organizer, I want to create new events so I can organize music performances at piano venues.

### Test Environment Setup

- [ ] User authenticated with wallet or username
- [ ] Test venues available in database
- [ ] User has appropriate permissions

### Critical Path Tests

#### TC-209-001: Access Event Creation Form

**Priority:** P0 (Critical)

**Preconditions:**

- User is logged in (wallet connected OR username session)

**Test Steps:**

1. Navigate to `/events/create`
2. Verify form loads successfully
3. Verify all form fields are present:
   - Event Title (required)
   - Description (required)
   - Venue Selection (required)
   - Start Date & Time (required)
   - End Date & Time (optional)
   - Max Attendees (optional)
   - Event Type (dropdown)
   - Tags/Categories
   - Cover Image URL (optional)
   - Require RSVP Approval (checkbox)
4. Verify field validation indicators

**Expected Results:**

- Form loads without errors
- All fields render correctly
- Required fields are marked with asterisk
- Help text/tooltips display where needed

---

#### TC-209-002: Create Event - Valid Data

**Priority:** P0 (Critical)

**Test Steps:**

1. Navigate to `/events/create`
2. Fill in all required fields with valid data:
   ```
   Title: "Jazz Piano Night"
   Description: "Join us for an evening of jazz piano performances..."
   Venue: Select "Blue Note Cafe"
   Start Date: 2025-03-15
   Start Time: 19:00
   End Time: 22:00
   Max Attendees: 50
   Event Type: "Performance"
   ```
3. Click "Create Event" button
4. Verify loading state displays
5. Verify success message appears
6. Verify redirect to event detail page

**Expected Results:**

- Event is created successfully in database
- User receives success confirmation
- Redirected to new event's detail page
- Event displays correctly with all data

---

#### TC-209-003: Form Validation - Missing Required Fields

**Priority:** P0 (Critical)

**Test Steps:**

1. Navigate to `/events/create`
2. Leave Title field blank
3. Fill other required fields
4. Click "Create Event"
5. Verify error message displays for Title field
6. Verify form does not submit
7. Fill Title field
8. Leave Description blank
9. Click "Create Event"
10. Verify error message for Description
11. Repeat for each required field

**Expected Results:**

- Validation errors display inline
- Error messages are clear and helpful
- Form does not submit with missing required fields
- Error styling is consistent
- Focus moves to first error field

---

#### TC-209-004: Date/Time Validation

**Priority:** P1 (High)

**Test Steps:**

1. Navigate to `/events/create`
2. Set Start Date to past date
3. Verify error: "Start date must be in the future"
4. Set Start Date to valid future date
5. Set End Time before Start Time
6. Verify error: "End time must be after start time"
7. Set valid date/time range
8. Verify no errors display

**Expected Results:**

- Cannot create event in the past
- End time must be after start time
- Time validation works across date boundaries
- Error messages are specific and helpful

---

#### TC-209-005: Venue Selection

**Priority:** P1 (High)

**Test Steps:**

1. Navigate to `/events/create`
2. Click Venue dropdown/selector
3. Verify list of verified venues displays
4. Verify venues are searchable/filterable
5. Select a venue
6. Verify venue details display (address, name)
7. Verify venue ID is captured correctly
8. Submit form
9. Verify event links to correct venue

**Expected Results:**

- Only verified venues are available
- Venue search works efficiently
- Selected venue displays clearly
- Venue relationship is saved correctly

---

#### TC-209-006: Optional Fields Handling

**Priority:** P2 (Medium)

**Test Steps:**

1. Create event with only required fields
2. Verify event is created successfully
3. Create event with all optional fields filled
4. Verify all data is saved
5. Leave Max Attendees blank
6. Verify unlimited capacity is set
7. Leave End Time blank
8. Verify event displays as "time TBD" or similar

**Expected Results:**

- Events can be created with minimal data
- Optional fields enhance event details when provided
- Default values are sensible
- Data integrity is maintained

---

#### TC-209-007: Image Upload/URL

**Priority:** P2 (Medium)

**Test Steps:**

1. Navigate to event creation form
2. Enter valid image URL
3. Verify image preview displays
4. Enter invalid URL
5. Verify error handling
6. Test with very large image URL
7. Leave image field blank
8. Verify default/placeholder image displays

**Expected Results:**

- Valid image URLs work correctly
- Image preview loads
- Invalid URLs show error
- Default image provides good UX

---

### Edge Cases & Error Scenarios

#### TC-209-008: Concurrent Event Creation

**Test Steps:**

1. Open event creation form in two browser tabs
2. Fill different event data in each
3. Submit from Tab 1
4. Immediately submit from Tab 2
5. Verify both events are created
6. Verify no data corruption

**Expected Results:**

- Multiple events can be created concurrently
- No race conditions or data loss
- Each event is unique and complete

---

#### TC-209-009: Network Interruption During Creation

**Test Steps:**

1. Fill out event creation form
2. Disconnect network before clicking submit
3. Click "Create Event"
4. Verify error handling
5. Reconnect network
6. Verify form data is preserved
7. Click "Create Event" again
8. Verify event is created

**Expected Results:**

- Network errors are handled gracefully
- Form data is not lost
- User can retry without re-entering data
- No duplicate events are created

---

#### TC-209-010: Special Characters in Event Data

**Test Steps:**

1. Create event with title containing special characters: `"Jazz & Blues: The 90's Revival (Part 2)"`
2. Include emojis in description: `"🎹 Piano 🎵 Music 🎉 Party"`
3. Test XSS attempt: `"<script>alert('XSS')</script>"`
4. Submit form
5. Verify special characters are preserved
6. Verify XSS is sanitized/escaped
7. View event detail page
8. Verify content displays safely

**Expected Results:**

- Special characters are preserved
- Emojis display correctly
- XSS attempts are sanitized
- No security vulnerabilities

---

#### TC-209-011: Max Attendees Edge Cases

**Test Steps:**

1. Set Max Attendees to 0
2. Verify error or warning
3. Set Max Attendees to negative number
4. Verify error
5. Set Max Attendees to 99999
6. Verify accepted or reasonable limit warning
7. Test non-numeric input
8. Verify validation

**Expected Results:**

- Max Attendees must be positive integer or null
- Reasonable limits are enforced
- Input validation is robust

---

### Permission & Authorization Tests

#### TC-209-012: Create Event Without Authentication

**Priority:** P0 (Critical)

**Test Steps:**

1. Disconnect wallet AND log out username session
2. Navigate to `/events/create`
3. Verify redirect to login/connection page OR
4. Verify error message displays
5. Connect wallet
6. Verify access is granted

**Expected Results:**

- Unauthenticated users cannot create events
- Proper error messaging or redirect
- Authentication flow works smoothly

---

#### TC-209-013: Wallet vs Username Event Creation

**Priority:** P1 (High)

**Test Steps:**

1. Create event with wallet connected
2. Verify event links to wallet address
3. Disconnect wallet
4. Log in with username
5. Create event
6. Verify event links to username account
7. Verify both events display correctly

**Expected Results:**

- Both authentication methods work
- Event ownership is tracked correctly
- User can view/manage their events

---

### Mobile & Responsive Tests

#### TC-209-014: Mobile Form Completion

**Priority:** P1 (High)

**Test Steps:**

1. Open `/events/create` on mobile
2. Verify form fields are touch-friendly
3. Test date/time pickers on mobile
4. Test dropdown selections on mobile
5. Complete entire form on mobile
6. Submit and verify success

**Expected Results:**

- Form is fully functional on mobile
- Date/time pickers use native mobile controls
- Keyboard types are appropriate (numeric for attendees, etc.)
- Validation works on mobile
- Success flow works on mobile

---

### Accessibility Tests

#### TC-209-015: Form Accessibility

**Priority:** P1 (High)

**Test Steps:**

1. Navigate form using only keyboard
2. Verify all fields are reachable via Tab
3. Test form submission with Enter key
4. Use screen reader to complete form
5. Verify error announcements
6. Verify required field indicators are accessible
7. Test color contrast on form elements

**Expected Results:**

- Form is fully keyboard accessible
- Screen reader announces all labels and errors
- ARIA attributes are correct
- WCAG 2.1 AA compliance

---

## WPB-210: Events System - Event Detail Page

**Story:** As a user, I want to view detailed event information so I can decide whether to attend.

### Critical Path Tests

#### TC-210-001: View Event Details

**Priority:** P0 (Critical)

**Preconditions:**

- Event exists in database with ID
- Navigate to `/events/[id]`

**Test Steps:**

1. Navigate to event detail page
2. Verify all event information displays:
   - Event title
   - Event description (full text)
   - Venue name and address
   - Date and time
   - Organizer information
   - Current RSVP count / Max attendees
   - Event status badge (Published/Cancelled/Draft)
   - Cover image (if provided)
   - Tags/categories
   - Map/directions to venue (if implemented)
3. Verify "Back to Events" navigation
4. Verify "RSVP" button displays (for future events)

**Expected Results:**

- All event data displays correctly
- Layout is clean and readable
- Related venue information is accessible
- CTAs are prominent and clear

---

#### TC-210-002: RSVP Button Visibility Logic

**Priority:** P1 (High)

**Test Steps:**

1. View future event with spots available
2. Verify "RSVP Now" button displays
3. View past event
4. Verify "RSVP" button does not display or is disabled
5. View cancelled event
6. Verify "RSVP" button does not display
7. View event at max capacity
8. Verify "Event Full" or waitlist message displays
9. View event as organizer
10. Verify "Edit Event" button displays instead

**Expected Results:**

- RSVP button logic is correct for all scenarios
- Past/cancelled events don't allow RSVP
- Full events show appropriate message
- Organizers see management options

---

#### TC-210-003: Attendee List Display

**Priority:** P1 (High)

**Test Steps:**

1. View event with confirmed RSVPs
2. Verify attendee list section displays
3. Verify attendee information shown:
   - Display name or wallet address
   - User avatar (if available)
   - RSVP status (Confirmed/Maybe/Pending)
   - Attendee count (if +1s allowed)
4. Verify organizer can see pending RSVPs
5. Verify regular users see only confirmed RSVPs
6. Test privacy: Verify user addresses are truncated if shown

**Expected Results:**

- Attendee list displays correctly
- Privacy is respected
- Organizer has additional visibility
- List is paginated if many attendees

---

#### TC-210-004: Venue Information Integration

**Priority:** P1 (High)

**Test Steps:**

1. View event detail page
2. Locate venue information section
3. Verify venue name is clickable link
4. Click venue name
5. Verify navigation to venue detail page
6. Navigate back to event
7. Verify venue address displays
8. Verify map/directions link (if implemented)

**Expected Results:**

- Venue information is comprehensive
- Link to venue details works
- Address and location info is accurate
- Navigation flow is smooth

---

#### TC-210-005: Event Status Indicators

**Priority:** P2 (Medium)

**Test Steps:**

1. View published event
2. Verify "Published" or checkmark badge displays
3. View cancelled event
4. Verify "Cancelled" badge with warning color
5. Verify cancellation reason displays (if provided)
6. View draft event (as organizer)
7. Verify "Draft" badge displays
8. Verify public cannot access draft events

**Expected Results:**

- Status badges are visually distinct
- Cancelled events show reason
- Draft events are protected
- Status is always visible

---

### Edge Cases & Error Scenarios

#### TC-210-006: Event Not Found (404)

**Priority:** P0 (Critical)

**Test Steps:**

1. Navigate to `/events/99999` (non-existent ID)
2. Verify 404 error page displays
3. Verify error message is user-friendly
4. Verify "Back to Events" link displays
5. Test with invalid ID format: `/events/abc`
6. Verify appropriate error handling

**Expected Results:**

- 404 page is clear and helpful
- Provides navigation options
- No system errors exposed to user

---

#### TC-210-007: Deleted Event Handling

**Test Steps:**

1. Load event detail page
2. Have another user/curator delete the event
3. Refresh page
4. Verify appropriate error message
5. Verify redirect or navigation option

**Expected Results:**

- Deleted events show clear message
- User is guided to alternative action
- No broken state or infinite loading

---

#### TC-210-008: Long-Form Content Display

**Test Steps:**

1. Create event with very long description (5000+ characters)
2. View event detail page
3. Verify text is readable
4. Verify "Read More/Less" toggle (if implemented)
5. Verify page scrolling works correctly
6. Test with very long event title (200 characters)
7. Verify title truncates or wraps properly

**Expected Results:**

- Long content is handled gracefully
- Page layout doesn't break
- Readability is maintained
- Performance is acceptable

---

### Mobile & Responsive Tests

#### TC-210-009: Mobile Event Detail View

**Priority:** P1 (High)

**Test Steps:**

1. Open event detail on mobile
2. Verify all content is readable without zooming
3. Verify images scale appropriately
4. Verify RSVP button is easily tappable
5. Test map/directions on mobile
6. Verify attendee list works on mobile
7. Test sharing functionality (if implemented)

**Expected Results:**

- Layout adapts to mobile screens
- All information is accessible
- Touch targets are appropriately sized
- Mobile-specific features work (maps, share)

---

### Performance Tests

#### TC-210-010: Page Load Performance

**Test Steps:**

1. Measure time to load event detail page
2. Test with event that has 100+ RSVPs
3. Measure rendering time
4. Check for memory leaks on repeated loads
5. Test image loading performance

**Expected Results:**

- Initial load < 2 seconds
- Large RSVP lists are paginated
- No performance degradation on repeat visits
- Images lazy load appropriately

---

## WPB-211: Events System - RSVP Management

**Story:** As a user, I want to RSVP to events so I can confirm my attendance.

### Critical Path Tests

#### TC-211-001: Submit RSVP - First Time

**Priority:** P0 (Critical)

**Preconditions:**

- User is authenticated
- Event is future and not at capacity
- User has not previously RSVP'd

**Test Steps:**

1. Navigate to event detail page
2. Click "RSVP" button
3. If RSVP modal opens, verify fields:
   - Attendee count selector (1, 2, 3+)
   - Optional notes field
   - "Confirm RSVP" button
4. Select attendee count: 2
5. Enter notes: "Looking forward to this!"
6. Click "Confirm RSVP"
7. Verify success message displays
8. Verify RSVP count updates on page
9. Verify "RSVP" button changes to "Modify RSVP" or "Cancel RSVP"
10. Verify user appears in attendee list

**Expected Results:**

- RSVP is recorded in database
- User receives confirmation
- UI updates to reflect RSVP status
- Email notification sent (if implemented)

**Database Verification:**

```sql
SELECT * FROM "EventRSVP"
WHERE "eventId" = [event_id]
AND "userId" = [user_id];
```

---

#### TC-211-002: Modify Existing RSVP

**Priority:** P1 (High)

**Test Steps:**

1. User has existing RSVP with status "CONFIRMED", attendeeCount 2
2. Navigate to event detail page
3. Click "Modify RSVP" button
4. Change attendee count to 3
5. Update notes
6. Click "Save Changes"
7. Verify success message
8. Verify updated count displays
9. Verify updated data in attendee list

**Expected Results:**

- RSVP updates successfully
- Changes reflect immediately
- Capacity checks still apply
- Audit trail maintained (if implemented)

---

#### TC-211-003: Cancel RSVP

**Priority:** P1 (High)

**Test Steps:**

1. User has existing RSVP
2. Navigate to event detail page
3. Click "Cancel RSVP" button
4. Verify confirmation modal displays: "Are you sure you want to cancel your RSVP?"
5. Click "Yes, Cancel"
6. Verify RSVP is removed
7. Verify RSVP count decrements
8. Verify user is removed from attendee list
9. Verify "RSVP" button reappears
10. Verify capacity opens up for others

**Expected Results:**

- RSVP is soft-deleted or status updated to "DECLINED"
- Capacity is freed
- User can re-RSVP later
- Confirmation prevents accidental cancellation

---

#### TC-211-004: RSVP to Event Requiring Approval

**Priority:** P1 (High)

**Preconditions:**

- Event has `requireApproval = true`

**Test Steps:**

1. User submits RSVP
2. Verify RSVP status is "PENDING"
3. Verify message displays: "Your RSVP is pending organizer approval"
4. Verify user does NOT appear in confirmed attendee list
5. Log in as event organizer
6. Navigate to event management page
7. Verify pending RSVP appears in approval queue
8. Click "Approve" on pending RSVP
9. Verify RSVP status changes to "CONFIRMED"
10. Verify user receives notification (if implemented)
11. Verify user now appears in attendee list

**Expected Results:**

- Approval workflow works correctly
- Pending RSVPs are managed separately
- Organizer has full control
- Users are notified of approval status

---

#### TC-211-005: RSVP When Event is Near/At Capacity

**Priority:** P0 (Critical)

**Preconditions:**

- Event max attendees: 50
- Current confirmed RSVPs: 48 attendees

**Test Steps:**

1. User A RSVPs with attendee count: 2
2. Verify RSVP succeeds (total now 50)
3. User B attempts to RSVP with count: 1
4. Verify error: "Event is at capacity"
5. Verify RSVP is NOT created
6. User A cancels RSVP (frees 2 spots)
7. User B RSVPs with count: 1
8. Verify RSVP succeeds (total now 49)

**Expected Results:**

- Capacity enforcement is strict
- Race conditions are handled (multiple users RSVPing simultaneously)
- Clear error messages for capacity issues
- Real-time capacity updates

---

#### TC-211-006: RSVP Status Options

**Priority:** P2 (Medium)

**Test Steps:**

1. Test RSVP with status "CONFIRMED"
2. Verify user counted in attendee list
3. Test RSVP with status "MAYBE"
4. Verify user appears in "Maybe" section (if separate)
5. Verify "Maybe" users don't count toward capacity
6. Test changing status from "MAYBE" to "CONFIRMED"
7. Verify capacity check applies
8. Test "DECLINED" status
9. Verify user removed from lists

**Expected Results:**

- Different RSVP statuses work correctly
- Capacity calculations respect status
- Users can change status
- Lists segment by status appropriately

---

### Edge Cases & Error Scenarios

#### TC-211-007: RSVP to Past Event

**Priority:** P1 (High)

**Test Steps:**

1. Attempt to RSVP to event with start date in past
2. Verify error: "Cannot RSVP to past events"
3. Verify RSVP is not created
4. Verify button is disabled or hidden

**Expected Results:**

- Past event RSVPs are prevented
- Clear error message
- UI reflects non-RSVPable status

---

#### TC-211-008: RSVP to Cancelled Event

**Priority:** P1 (High)

**Test Steps:**

1. Attempt to RSVP to cancelled event
2. Verify error: "Cannot RSVP to cancelled event"
3. Verify existing RSVPs show "Event Cancelled" message
4. Verify no new RSVPs can be created

**Expected Results:**

- Cancelled events don't accept RSVPs
- Existing RSVPs are preserved but noted as cancelled
- Clear communication to users

---

#### TC-211-009: Concurrent RSVP Submissions (Race Condition)

**Priority:** P0 (Critical)

**Preconditions:**

- Event has 1 spot remaining (max: 50, current: 49)

**Test Steps:**

1. Open event page in two browser tabs/sessions with different users
2. Simultaneously click RSVP in both tabs (within 100ms)
3. Verify only one RSVP succeeds
4. Verify second user receives "Event is full" error
5. Verify total attendees = 50 (not 51)
6. Verify database constraint prevents over-capacity

**Expected Results:**

- Race condition is handled correctly
- Database constraints prevent over-booking
- Both users receive appropriate feedback
- No data corruption

**Database Check:**

```sql
SELECT SUM("attendeeCount") as total
FROM "EventRSVP"
WHERE "eventId" = [id] AND status = 'CONFIRMED';
-- Should never exceed maxAttendees
```

---

#### TC-211-010: RSVP Without Authentication

**Priority:** P0 (Critical)

**Test Steps:**

1. Disconnect wallet and logout username
2. Navigate to event detail page
3. Click RSVP button
4. Verify redirect to login/connection page OR
5. Verify modal prompts for authentication
6. Authenticate
7. Verify return to RSVP flow
8. Complete RSVP

**Expected Results:**

- Unauthenticated users cannot RSVP
- Clear authentication prompts
- Flow resumes after authentication

---

#### TC-211-011: Multiple Attendees (+1s) Handling

**Priority:** P2 (Medium)

**Test Steps:**

1. RSVP with attendee count: 5
2. Verify capacity calculation includes all 5
3. Verify display shows "John + 4 guests"
4. Reduce attendee count to 2
5. Verify capacity recalculates
6. Test maximum attendee count limit (e.g., 10 per RSVP)
7. Verify error if exceeded

**Expected Results:**

- Multiple attendees are tracked correctly
- Capacity math is accurate
- Reasonable limits prevent abuse
- Display is clear about guest counts

---

### Mobile & Responsive Tests

#### TC-211-012: Mobile RSVP Flow

**Priority:** P1 (High)

**Test Steps:**

1. Open event on mobile device
2. Tap RSVP button
3. Verify modal is mobile-friendly
4. Complete RSVP form on mobile
5. Submit and verify success
6. Verify mobile notifications (if applicable)

**Expected Results:**

- RSVP flow works smoothly on mobile
- Touch targets are appropriately sized
- Forms are easy to complete on mobile
- Success feedback is clear

---

### Email/Notification Tests

#### TC-211-013: RSVP Confirmation Notifications

**Priority:** P2 (Medium)

**Test Steps:**

1. User RSVPs to event
2. Verify confirmation email/notification sent
3. Check email contains:
   - Event details
   - RSVP confirmation
   - Calendar invite attachment (.ics)
   - Link to event page
   - Instructions for cancellation
4. Test notification preferences (if implemented)

**Expected Results:**

- Notifications are sent reliably
- Content is helpful and complete
- Calendar invites work correctly
- Users can manage notification preferences

---

## WPB-212: Events System - Event Management

**Story:** As an event organizer, I want to manage my events so I can update details, manage RSVPs, and cancel events if needed.

### Critical Path Tests

#### TC-212-001: View My Events Dashboard

**Priority:** P0 (Critical)

**Preconditions:**

- User is authenticated
- User has created at least 3 events

**Test Steps:**

1. Navigate to organizer dashboard or "My Events" page
2. Verify list of user's created events displays
3. Verify each event shows:
   - Event title and date
   - Status (Draft/Published/Cancelled)
   - RSVP count
   - Quick actions (Edit, View, Cancel)
4. Verify filter by status (All/Upcoming/Past/Draft/Cancelled)
5. Verify sort options (Date, Title, RSVP Count)

**Expected Results:**

- All user's events display correctly
- Summary information is accurate
- Filters and sorting work
- Quick actions are accessible

---

#### TC-212-002: Edit Event Details

**Priority:** P0 (Critical)

**Preconditions:**

- User is event organizer
- Event exists and is not cancelled

**Test Steps:**

1. Navigate to event detail page
2. Click "Edit Event" button
3. Verify edit form loads with existing data
4. Modify event title: "Updated Event Title"
5. Change date to future date
6. Update description
7. Modify max attendees (increase from 50 to 75)
8. Click "Save Changes"
9. Verify success message
10. Verify event detail page shows updated information
11. Verify existing RSVPs are preserved
12. Verify attendees receive update notification (if implemented)

**Expected Results:**

- Edit form loads with existing data
- Changes are saved successfully
- Related data integrity is maintained
- Users are notified of significant changes

---

#### TC-212-003: Edit Event - Capacity Constraints

**Priority:** P0 (Critical)

**Preconditions:**

- Event has 30 confirmed RSVPs
- Current max attendees: 50

**Test Steps:**

1. Edit event
2. Attempt to reduce max attendees to 20
3. Verify error: "Cannot reduce capacity below current RSVP count (30)"
4. Change max attendees to 30 (exact current count)
5. Verify warning: "This event is now at capacity"
6. Allow save with warning
7. Change max attendees to 40
8. Verify save succeeds without warning

**Expected Results:**

- Cannot reduce capacity below existing RSVPs
- Clear error messages
- Warnings for at-capacity events
- Data integrity maintained

---

#### TC-212-004: Manage Pending RSVPs (Approval Queue)

**Priority:** P1 (High)

**Preconditions:**

- Event requires approval
- 5 pending RSVPs exist

**Test Steps:**

1. Navigate to event management page
2. Locate "Pending RSVPs" section
3. Verify list of pending RSVPs displays with:
   - User name/address
   - Attendee count
   - Notes (if provided)
   - Timestamp
   - Approve/Reject buttons
4. Click "Approve" on first RSVP
5. Verify RSVP status changes to "CONFIRMED"
6. Verify user removed from pending list
7. Verify confirmed count increments
8. Click "Reject" on second RSVP
9. Verify RSVP status changes to "DECLINED"
10. Verify user receives notification (if implemented)

**Expected Results:**

- Approval queue is clearly visible
- Approve/reject actions work correctly
- Users are notified of decisions
- Capacity calculations update

---

#### TC-212-005: Manage Confirmed RSVPs

**Priority:** P2 (Medium)

**Test Steps:**

1. Navigate to event management page
2. View list of confirmed RSVPs
3. Verify organizer can:
   - View attendee details
   - Send message to attendees (if implemented)
   - Export attendee list (CSV/PDF)
   - Manually cancel RSVP (with confirmation)
4. Test each action
5. Verify data accuracy

**Expected Results:**

- Organizer has full visibility
- Management actions work correctly
- Export formats are usable
- Manual RSVP cancellation requires confirmation

---

#### TC-212-006: Cancel Event

**Priority:** P0 (Critical)

**Preconditions:**

- Event has 20 confirmed RSVPs
- Event is published

**Test Steps:**

1. Navigate to event management page
2. Click "Cancel Event" button
3. Verify confirmation modal displays
4. Enter cancellation reason: "Venue double-booked"
5. Confirm cancellation
6. Verify event status changes to "CANCELLED"
7. Verify all RSVPs are notified (if implemented)
8. Verify event still visible but marked cancelled
9. Verify new RSVPs cannot be created
10. Verify existing RSVPs show cancelled status
11. Verify event appears in "Cancelled" filter

**Expected Results:**

- Cancellation requires confirmation and reason
- All attendees are notified
- Event data is preserved (soft delete)
- Status is clear throughout system
- Analytics track cancellation

---

#### TC-212-007: Publish Draft Event

**Priority:** P1 (High)

**Preconditions:**

- Event exists with status "DRAFT"

**Test Steps:**

1. Navigate to draft event management page
2. Verify "Publish Event" button displays
3. Verify preview of event as it will appear public
4. Click "Publish Event"
5. Verify confirmation modal
6. Confirm publication
7. Verify event status changes to "PUBLISHED"
8. Verify event appears in public events directory
9. Verify event is RSVP-able
10. Verify SEO/social sharing metadata generated

**Expected Results:**

- Draft to publish transition is smooth
- Published events are immediately visible
- All features become active
- Metadata is properly set

---

#### TC-212-008: Duplicate/Clone Event

**Priority:** P2 (Medium)

**Test Steps:**

1. Navigate to existing event
2. Click "Duplicate Event" or "Create Similar"
3. Verify new event form pre-fills with:
   - Similar title (e.g., "Copy of Jazz Night")
   - Same description
   - Same venue
   - Future date (not copied)
   - Same settings (approval, capacity, type)
4. Modify details
5. Create new event
6. Verify original event unchanged
7. Verify new event exists independently

**Expected Results:**

- Duplication saves organizer time
- Original event is not modified
- New event is independent
- Reasonable defaults for dates

---

### Edge Cases & Error Scenarios

#### TC-212-009: Edit Event Concurrently

**Test Steps:**

1. Open event edit form in two browser tabs
2. Make different changes in each tab
3. Save from Tab 1
4. Save from Tab 2
5. Verify conflict handling (last write wins OR merge OR error)
6. Verify no data corruption

**Expected Results:**

- Concurrent edits are handled safely
- User is notified of conflicts (if applicable)
- Data integrity maintained
- No unexpected overwrites

---

#### TC-212-010: Delete Event vs Cancel Event

**Priority:** P1 (High)

**Test Steps:**

1. As blog owner/admin, verify "Delete Event" option exists
2. As regular organizer, verify only "Cancel Event" option
3. Delete event (admin action)
4. Verify event is completely removed or hard-deleted
5. Verify RSVPs are handled (cascaded delete or marked orphaned)
6. Verify deleted event does not appear anywhere
7. Test restoring deleted event (if soft-delete implemented)

**Expected Results:**

- Delete vs Cancel distinction is clear
- Delete is restricted to admins
- Cascade behaviors are correct
- Soft-delete allows recovery

---

#### TC-212-011: Edit Event After RSVPs

**Priority:** P1 (High)

**Test Steps:**

1. Event has 30 RSVPs
2. Change event date by 1 week
3. Verify notification sent to all RSVPs
4. Change venue
5. Verify notification sent
6. Change max attendees (increase)
7. Verify no notification (minor change)
8. Change event to past date
9. Verify error or warning

**Expected Results:**

- Significant changes trigger notifications
- Minor changes don't spam attendees
- Date/venue changes require re-confirmation (optional)
- Past dates prevented or warned

---

### Permission & Authorization Tests

#### TC-212-012: Edit Event - Not Owner

**Priority:** P0 (Critical)

**Test Steps:**

1. User A creates event
2. User B (not organizer) navigates to event
3. Verify "Edit Event" button does NOT display for User B
4. User B attempts direct URL: `/events/[id]/edit`
5. Verify 403 Forbidden error
6. Verify error message: "You are not authorized to edit this event"

**Expected Results:**

- Only organizer can edit event
- Direct URL access is protected
- Clear authorization errors

---

#### TC-212-013: Admin Override Permissions

**Priority:** P2 (Medium)

**Test Steps:**

1. Log in as blog owner/admin
2. Navigate to any event (not created by admin)
3. Verify admin CAN edit event
4. Verify admin CAN cancel event
5. Verify admin CAN delete event
6. Make edit as admin
7. Verify audit log records admin action (if implemented)

**Expected Results:**

- Admins have override permissions
- Admin actions are logged
- Original organizer is notified (optional)

---

### Mobile & Responsive Tests

#### TC-212-014: Mobile Event Management

**Priority:** P1 (High)

**Test Steps:**

1. Access event management on mobile
2. Verify dashboard is mobile-responsive
3. Test editing event on mobile
4. Test RSVP approval on mobile
5. Test event cancellation on mobile
6. Verify all actions work correctly

**Expected Results:**

- Full management capability on mobile
- UI adapts to mobile screens
- Touch interactions work smoothly
- No functionality lost on mobile

---

### Performance & Scalability Tests

#### TC-212-015: Manage Event with Many RSVPs

**Test Steps:**

1. Create event with 500+ RSVPs
2. Load event management page
3. Measure load time
4. Test pagination of RSVP list
5. Test search/filter within RSVPs
6. Export attendee list
7. Measure export time

**Expected Results:**

- Page loads in < 3 seconds
- RSVP list is paginated
- Search/filter is performant
- Export handles large datasets
- No browser freezing or crashes

---

## WPB-202: RBAC System Implementation

**Story:** As a system administrator, I want role-based access control so I can manage user permissions securely.

### Critical Path Tests

#### TC-202-001: Assign Role to User

**Priority:** P0 (Critical)

**Preconditions:**

- Admin is logged in
- Test user exists

**Test Steps:**

1. Navigate to user management page (if UI exists) OR
2. Use API endpoint: `POST /api/rbac/assign-role`
3. Assign "CURATOR" role to test user
4. Verify response: `{ success: true, role: "CURATOR" }`
5. Query user's roles
6. Verify "CURATOR" role is assigned
7. Log in as test user
8. Navigate to curator dashboard
9. Verify access granted

**Expected Results:**

- Role assignment succeeds
- Database updated correctly
- User gains appropriate permissions
- Access control enforced immediately

**Database Verification:**

```sql
SELECT * FROM "UserRole"
WHERE "userId" = [user_id] AND role = 'CURATOR';
```

---

#### TC-202-002: Remove Role from User

**Priority:** P1 (High)

**Test Steps:**

1. User has "CURATOR" role
2. Admin removes role: `DELETE /api/rbac/remove-role`
3. Verify response: `{ success: true }`
4. Query user's roles
5. Verify "CURATOR" role is removed
6. Log in as user
7. Attempt to access curator dashboard
8. Verify access denied

**Expected Results:**

- Role removal succeeds
- Permissions revoked immediately
- User cannot access restricted resources
- Clear error messages for denied access

---

#### TC-202-003: Role Hierarchy and Inheritance

**Priority:** P1 (High)

**Test Steps:**

1. Define role hierarchy: ADMIN > CURATOR > USER
2. Assign "ADMIN" role to user
3. Verify user has ADMIN permissions
4. Verify user also has CURATOR permissions (inherited)
5. Verify user has USER permissions (inherited)
6. Test access to admin-only feature
7. Test access to curator feature
8. Verify both work

**Expected Results:**

- Role hierarchy is enforced
- Higher roles inherit lower role permissions
- Permission checks respect hierarchy
- No permission gaps

---

#### TC-202-004: Permission Checks Across Features

**Priority:** P0 (Critical)

**Test Scenarios:**

- User without CURATOR role attempts to verify venue → Denied
- User with CURATOR role verifies venue → Allowed
- User without EVENT_ORGANIZER role creates event → Allowed (default)
- User with ADMIN role accesses all features → Allowed
- User with no roles accesses public features → Allowed

**Expected Results:**

- All permission checks work correctly
- No unauthorized access possible
- Default permissions are sensible
- Admin bypass works

---

#### TC-202-005: RBAC API Endpoints Security

**Priority:** P0 (Critical)

**Test Steps:**

1. Attempt to assign role without authentication
2. Verify 401 Unauthorized error
3. Attempt to assign role as regular user (not admin)
4. Verify 403 Forbidden error
5. Attempt to assign invalid role: "SUPER_ADMIN"
6. Verify 400 Bad Request with error message
7. Successfully assign role as admin
8. Verify 200 OK

**Expected Results:**

- RBAC endpoints are fully protected
- Only admins can manage roles
- Invalid inputs are rejected
- Proper HTTP status codes returned

---

### Edge Cases & Error Scenarios

#### TC-202-006: Assign Multiple Roles to User

**Test Steps:**

1. Assign "CURATOR" role to user
2. Assign "EVENT_ORGANIZER" role to same user
3. Verify both roles exist for user
4. Verify user has permissions from both roles
5. Test feature requiring CURATOR
6. Test feature requiring EVENT_ORGANIZER
7. Verify both work

**Expected Results:**

- Users can have multiple roles
- All role permissions are cumulative
- No permission conflicts
- Database correctly stores multiple roles

---

#### TC-202-007: Remove Last Admin Role

**Test Steps:**

1. System has only 1 user with ADMIN role
2. Attempt to remove ADMIN role from that user
3. Verify error: "Cannot remove last admin"
4. Add ADMIN role to another user
5. Attempt removal again
6. Verify succeeds

**Expected Results:**

- System prevents removing last admin
- Safeguard against locking out admins
- Clear error messages
- Can remove once another admin exists

---

#### TC-202-008: Role Assignment Race Condition

**Test Steps:**

1. Open two browser tabs as admin
2. Simultaneously assign different roles to same user
3. Verify both assignments succeed
4. Verify no data corruption
5. Query user's roles
6. Verify both roles exist

**Expected Results:**

- Concurrent role assignments handled safely
- No database conflicts
- All assignments recorded correctly

---

#### TC-202-009: Case Sensitivity in Roles

**Test Steps:**

1. Attempt to assign role "curator" (lowercase)
2. Verify normalized to "CURATOR" OR error
3. Attempt "Curator" (mixed case)
4. Verify handling is consistent
5. Query roles
6. Verify canonical form stored

**Expected Results:**

- Role names are case-insensitive or normalized
- Consistent storage format
- No duplicate roles due to case differences

---

### Database & Backend Tests

#### TC-202-010: RBAC Database Schema Validation

**Test Steps:**

1. Verify UserRole table exists with correct schema:
   ```sql
   CREATE TABLE "UserRole" (
     "id" SERIAL PRIMARY KEY,
     "userId" INTEGER NOT NULL,
     "role" TEXT NOT NULL,
     "assignedAt" TIMESTAMP DEFAULT NOW(),
     "assignedBy" INTEGER,
     UNIQUE("userId", "role")
   );
   ```
2. Verify foreign key constraints
3. Verify unique constraint on (userId, role)
4. Test cascade behavior on user deletion

**Expected Results:**

- Schema matches design
- Constraints prevent invalid data
- Cascades work correctly
- Indexes exist for performance

---

#### TC-202-011: Permission Middleware Testing

**Test Steps:**

1. Review middleware: `requireRole(['CURATOR'])`
2. Test protected route with correct role → Allowed
3. Test protected route without role → Denied
4. Test route with multiple allowed roles → Correct behavior
5. Test role check performance with 100+ concurrent requests

**Expected Results:**

- Middleware correctly enforces permissions
- Performance is acceptable
- Error handling is robust
- Logging captures permission checks

---

### Audit & Logging Tests

#### TC-202-012: RBAC Audit Log

**Priority:** P2 (Medium)

**Test Steps:**

1. Enable audit logging (if implemented)
2. Assign role to user
3. Verify log entry created with:
   - Timestamp
   - Admin who assigned role
   - User who received role
   - Role assigned
   - Action: "ASSIGNED"
4. Remove role
5. Verify log entry for "REMOVED"
6. Query audit log
7. Verify all RBAC actions are logged

**Expected Results:**

- All role changes are logged
- Logs are immutable
- Sufficient detail for auditing
- Logs are queryable

---

## Venue Rejection Tracking

**Story:** As a curator, I want to track venue rejections so I can provide feedback and prevent resubmissions.

### Critical Path Tests

#### TC-VRT-001: Reject Venue with Reason

**Priority:** P0 (Critical)

**Test Steps:**

1. Navigate to curator dashboard
2. Select pending venue
3. Click "Reject" button
4. Verify rejection reason field is required
5. Leave field blank and click confirm
6. Verify error: "Rejection reason is required"
7. Enter reason: "Incomplete contact information"
8. Confirm rejection
9. Verify venue status updates to "Rejected"
10. Verify rejection reason saved
11. Verify rejection timestamp recorded
12. Verify submitter notified (if implemented)

**Expected Results:**

- Rejection requires reason
- Reason is stored in database
- Venue status updated correctly
- Submitter receives feedback

**Database Verification:**

```sql
SELECT "rejectionReason", "rejectedAt", "rejectedBy"
FROM "Venue"
WHERE id = [venue_id];
```

---

#### TC-VRT-002: View Rejection History

**Priority:** P1 (High)

**Test Steps:**

1. Venue has been rejected twice
2. Navigate to venue detail page (as curator)
3. Verify "Rejection History" section displays
4. Verify each rejection shows:
   - Date rejected
   - Reason
   - Curator who rejected
5. Verify most recent rejection is highlighted
6. Test with venue never rejected
7. Verify section doesn't display or shows "No rejections"

**Expected Results:**

- Complete rejection history visible
- Clear presentation of all rejections
- Most recent is emphasized
- Empty state handled gracefully

---

#### TC-VRT-003: Resubmit After Rejection

**Priority:** P1 (High)

**Test Steps:**

1. Venue is rejected
2. Submitter edits venue
3. Updates information based on rejection feedback
4. Resubmits venue for verification
5. Curator reviews resubmission
6. Verify rejection history still visible
7. Verify current submission marked as "Resubmission"
8. Curator approves venue
9. Verify rejection history preserved but status is "Verified"

**Expected Results:**

- Submitters can resubmit
- Rejection history preserved
- Resubmissions clearly marked
- Approval clears rejected status

---

#### TC-VRT-004: Prevent Duplicate Rejections

**Priority:** P2 (Medium)

**Test Steps:**

1. Venue is currently rejected
2. Curator attempts to reject again
3. Verify error or warning
4. Verify only one rejection record created

**Expected Results:**

- Cannot reject already-rejected venue
- Clear UI prevents duplicate actions
- Data integrity maintained

---

### Edge Cases

#### TC-VRT-005: Very Long Rejection Reasons

**Test Steps:**

1. Enter rejection reason with 5000+ characters
2. Submit rejection
3. Verify truncation or full text storage
4. View rejection reason
5. Verify readability (truncation with "Read More")

**Expected Results:**

- Long text handled gracefully
- UI doesn't break
- Full reason is accessible

---

## Venue Enhancement Features

**Story:** As a venue submitter, I want to provide comprehensive venue details so users can make informed decisions.

### Critical Path Tests

#### TC-VEF-001: Add Operating Hours

**Priority:** P1 (High)

**Test Steps:**

1. Create or edit venue
2. Locate "Operating Hours" section
3. For each day (Mon-Sun):
   - Toggle "Open" checkbox
   - Set open time: 09:00
   - Set close time: 17:00
4. Set Sunday as closed
5. Submit venue
6. View venue detail page
7. Verify operating hours display correctly
8. Verify closed days show "Closed"

**Expected Results:**

- Operating hours saved correctly
- Display is user-friendly
- Closed days handled properly
- Time format is consistent (12h vs 24h)

---

#### TC-VEF-002: Add Accessibility Features

**Priority:** P1 (High)

**Test Steps:**

1. Create or edit venue
2. Locate "Accessibility" section
3. Check all options:
   - Wheelchair Accessible
   - Elevator Access
   - Accessible Parking
   - Accessible Restroom
4. Submit venue
5. View venue detail page
6. Verify accessibility badges display
7. Verify icons or indicators are clear
8. Test search/filter by accessibility features

**Expected Results:**

- Accessibility options saved
- Clear display with icons/badges
- Filtering works correctly
- Helps users find accessible venues

---

#### TC-VEF-003: Add Ambiance Tags

**Priority:** P2 (Medium)

**Test Steps:**

1. Create or edit venue
2. Locate "Ambiance" section
3. Select tags: "cozy", "elegant", "intimate"
4. Submit venue
5. View venue detail page
6. Verify selected tags display
7. Test filtering venues by ambiance
8. Verify tag-based search works

**Expected Results:**

- Ambiance tags saved as array
- Tags display nicely (colored badges)
- Filtering/search includes ambiance
- Predefined tag list prevents typos

---

#### TC-VEF-004: Comprehensive Venue Profile

**Priority:** P1 (High)

**Test Steps:**

1. Create venue with ALL fields filled:
   - Basic info (name, city, address, phone, contact, description)
   - Piano details (type, availability, quality)
   - Operating hours (all days)
   - Accessibility (all features)
   - Ambiance tags (multiple)
   - Amenities (WiFi, parking, food, drinks)
   - Images (cover + gallery)
   - Social media links
2. Submit venue
3. View venue detail page
4. Verify all information displays correctly
5. Verify layout is organized and readable
6. Test on mobile device

**Expected Results:**

- All data fields work correctly
- Display is well-organized
- No information overload
- Mobile layout adapts well

---

### Validation Tests

#### TC-VEF-005: Operating Hours Validation

**Test Steps:**

1. Set open time: 17:00
2. Set close time: 09:00 (before open time)
3. Attempt to submit
4. Verify error: "Close time must be after open time"
5. Set close time: 17:00 (same as open)
6. Verify error or warning
7. Set valid times (open: 09:00, close: 17:00)
8. Verify submission succeeds

**Expected Results:**

- Time validation prevents invalid ranges
- Clear error messages
- Handles edge cases (midnight crossover)
- 24-hour venues supported (optional)

---

#### TC-VEF-006: Required vs Optional Fields

**Test Steps:**

1. Verify basic info is required (name, city)
2. Verify operational details are optional
3. Submit venue with only required fields
4. Verify submission succeeds
5. Edit venue to add optional details
6. Verify update succeeds

**Expected Results:**

- Clear distinction between required/optional
- Minimal barrier to entry
- Optional fields enhance listings
- Progressive disclosure works well

---

## Navigation & UX Improvements

### Critical Path Tests

#### TC-NAV-001: Main Navigation Menu

**Priority:** P0 (Critical)

**Test Steps:**

1. View main navigation on homepage
2. Verify all menu items present:
   - Home
   - Blog
   - Venues
   - Events (NEW)
   - Submit
   - About
3. Click each menu item
4. Verify navigation to correct page
5. Verify active menu item is highlighted
6. Test on mobile (hamburger menu)

**Expected Results:**

- Navigation is complete and consistent
- Active states work correctly
- Mobile menu functions properly
- Fast navigation (no page reloads if SPA)

---

#### TC-NAV-002: Breadcrumb Navigation

**Priority:** P2 (Medium)

**Test Steps:**

1. Navigate to deep page: Events > [Event Detail] > Edit
2. Verify breadcrumbs display: Home > Events > Jazz Night > Edit
3. Click each breadcrumb link
4. Verify navigation works
5. Test truncation on mobile

**Expected Results:**

- Breadcrumbs show current path
- All links work correctly
- Mobile view is usable
- Improves wayfinding

---

#### TC-NAV-003: Back/Forward Browser Buttons

**Priority:** P1 (High)

**Test Steps:**

1. Navigate through: Home > Events > Event Detail
2. Click browser back button
3. Verify returns to Events list
4. Click forward button
5. Verify returns to Event Detail
6. Test with form submissions
7. Verify no double-submission issues

**Expected Results:**

- Browser navigation works correctly
- State is preserved appropriately
- No unexpected behaviors
- Form submissions handled safely

---

#### TC-NAV-004: Footer Links

**Priority:** P2 (Medium)

**Test Steps:**

1. Scroll to page footer
2. Verify footer sections:
   - About/Info links
   - Social media links
   - Privacy/Terms links
   - Copyright notice
3. Click each link
4. Verify all links work
5. Test external links open in new tab

**Expected Results:**

- Footer is complete and informative
- All links are valid
- External links handled properly
- Copyright is current year

---

### Performance Tests

#### TC-NAV-005: Page Load Performance

**Test Steps:**

1. Measure load time for each main page:
   - Homepage
   - Events directory
   - Venues directory
   - Event detail
   - Venue detail
2. Test on slow 3G connection
3. Test with browser cache cleared
4. Test with cache present

**Expected Results:**

- All pages load < 3 seconds on normal connection
- Acceptable degradation on slow connections
- Caching improves repeat visits
- Core content visible quickly (progressive enhancement)

---

#### TC-NAV-006: Route Transitions

**Priority:** P2 (Medium)

**Test Steps:**

1. Navigate between pages
2. Measure transition time
3. Verify loading indicators display
4. Test rapid navigation (click multiple links quickly)
5. Verify no race conditions or errors

**Expected Results:**

- Page transitions are smooth
- Loading states prevent confusion
- Rapid navigation handled correctly
- No memory leaks on repeated navigation

---

## Production Build Verification

**Story:** As a developer, I want to ensure production builds succeed so the site deploys correctly.

### Critical Path Tests

#### TC-BUILD-001: Local Production Build

**Priority:** P0 (Critical)

**Test Steps:**

1. Run `yarn build` locally
2. Verify build completes without errors
3. Check for warnings
4. Verify output:
   - .next/ directory created
   - All pages compiled
   - Static assets generated
5. Run `yarn start`
6. Verify production server starts
7. Navigate to all main routes
8. Verify site functions correctly in production mode

**Expected Results:**

- Build completes successfully
- No TypeScript errors
- No ESLint errors
- Production bundle is optimized

**Command Output to Verify:**

```bash
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                   XXX kB      XXX kB
├ ○ /events                             XXX kB      XXX kB
└ ○ /venues                             XXX kB      XXX kB
```

---

#### TC-BUILD-002: Vercel Deployment

**Priority:** P0 (Critical)

**Test Steps:**

1. Push code to GitHub main branch
2. Verify Vercel build triggers automatically
3. Monitor build logs in Vercel dashboard
4. Verify build succeeds
5. Verify deployment completes
6. Visit production URL
7. Test all critical features on production

**Expected Results:**

- Vercel build succeeds
- All environment variables loaded correctly
- Database connections work
- No 500 errors on any pages
- Performance is acceptable

---

#### TC-BUILD-003: TypeScript Type Checking

**Priority:** P0 (Critical)

**Test Steps:**

1. Run `yarn tsc --noEmit`
2. Verify no type errors
3. Check recently modified files for type safety
4. Verify strict mode compliance (if enabled)

**Expected Results:**

- Zero TypeScript errors
- No `any` types in critical paths (optional)
- Strong type safety maintained

---

#### TC-BUILD-004: Environment Variables

**Priority:** P0 (Critical)

**Test Steps:**

1. Verify all required env vars are documented
2. Check `.env.example` is up to date
3. Verify Vercel has all production env vars set
4. Test feature that uses env var (e.g., database URL)
5. Verify no hardcoded secrets in code

**Expected Results:**

- All env vars documented
- Production env vars configured
- No exposed secrets
- Features work correctly

---

#### TC-BUILD-005: Database Migrations

**Priority:** P1 (High)

**Test Steps:**

1. Verify all migrations are applied to production database
2. Run `npx prisma migrate status`
3. Verify schema matches Prisma schema file
4. Test critical database operations
5. Verify no migration conflicts

**Expected Results:**

- Database schema is up to date
- All migrations successful
- No pending migrations
- Data integrity maintained

---

#### TC-BUILD-006: Bundle Size Analysis

**Priority:** P2 (Medium)

**Test Steps:**

1. Run `yarn analyze` (if configured)
2. Review bundle size report
3. Verify no unexpectedly large bundles
4. Check for duplicate dependencies
5. Verify code splitting is effective

**Expected Results:**

- Total bundle size < 500kb (gzipped)
- Code splitting reduces initial load
- No duplicate large libraries
- Lazy loading implemented where appropriate

---

## Regression Testing Checklist

This section covers critical existing features that must still work after Sprint 2 changes.

### Core Feature Regression

#### TC-REG-001: Venue Submission Still Works

**Priority:** P0 (Critical)

**Test Steps:**

1. Navigate to `/submit`
2. Complete venue submission form
3. Submit form
4. Verify success message
5. Verify venue appears in pending list
6. Verify no errors in console

**Expected Results:**

- Venue submission unchanged and working
- No breaking changes from new features

---

#### TC-REG-002: Venue Verification Still Works

**Priority:** P0 (Critical)

**Test Steps:**

1. Log in as curator
2. Navigate to curator dashboard
3. Verify pending venues list
4. Approve a venue
5. Verify venue moves to verified
6. Reject a venue with reason
7. Verify rejection tracking works

**Expected Results:**

- Existing curator functionality intact
- New rejection tracking integrated smoothly

---

#### TC-REG-003: Venue Directory Display

**Priority:** P0 (Critical)

**Test Steps:**

1. Navigate to `/venues`
2. Verify venue list displays
3. Verify filtering works (by city, piano availability)
4. Verify sorting works
5. Click venue to view details
6. Verify detail page displays correctly

**Expected Results:**

- No regressions in venue browsing
- All filters/sorting work
- Performance is maintained

---

#### TC-REG-004: Blog Functionality

**Priority:** P1 (High)

**Test Steps:**

1. Navigate to blog
2. Verify blog posts display
3. Click to read full post
4. Verify MDX rendering works
5. Verify images load
6. Test navigation between posts

**Expected Results:**

- Blog is unaffected by Sprint 2 changes
- All content renders correctly
- No broken links or images

---

#### TC-REG-005: Wallet Connection

**Priority:** P0 (Critical)

**Test Steps:**

1. Click "Connect Wallet" button
2. Connect MetaMask
3. Verify connection succeeds
4. Verify wallet address displays
5. Disconnect wallet
6. Verify disconnection works
7. Test Celo network switching

**Expected Results:**

- Wallet connection unchanged
- RBAC changes don't break wallet auth
- Network switching still works

---

### Cross-Feature Integration Tests

#### TC-INT-001: Event at Venue Integration

**Priority:** P1 (High)

**Test Steps:**

1. Create event at specific venue
2. Navigate to venue detail page
3. Verify "Upcoming Events" section displays
4. Verify event link works
5. Navigate to event detail
6. Verify venue link works (bidirectional)

**Expected Results:**

- Events and venues are properly linked
- Navigation between them is seamless
- Data consistency maintained

---

#### TC-INT-002: User Profile Across Features

**Priority:** P2 (Medium)

**Test Steps:**

1. User submits venue
2. User creates event
3. User RSVPs to event
4. Navigate to user profile (if implemented)
5. Verify all activities display:
   - Submitted venues
   - Organized events
   - RSVP'd events

**Expected Results:**

- User activities tracked across features
- Profile aggregates all user data
- Links to entities work correctly

---

## Accessibility & Compliance

### WCAG 2.1 AA Compliance Tests

#### TC-A11Y-001: Keyboard Navigation

**Priority:** P1 (High)

**Test Steps:**

1. Navigate entire site using only keyboard
2. Verify all interactive elements are reachable
3. Verify focus indicators are visible
4. Verify tab order is logical
5. Test form submission with Enter key
6. Test dropdowns with arrow keys

**Expected Results:**

- Full keyboard accessibility
- Visible focus indicators
- Logical navigation order
- No keyboard traps

---

#### TC-A11Y-002: Screen Reader Compatibility

**Priority:** P1 (High)

**Test Steps:**

1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Navigate events directory
3. Verify headings are announced
4. Verify links are descriptive
5. Complete RSVP form with screen reader
6. Verify form errors are announced
7. Test image alt text

**Expected Results:**

- All content is accessible to screen readers
- Semantic HTML used correctly
- ARIA labels where needed
- Form validation announced

---

#### TC-A11Y-003: Color Contrast

**Priority:** P1 (High)

**Test Steps:**

1. Use contrast checker tool (e.g., WAVE, axe DevTools)
2. Check all text/background combinations
3. Verify minimum contrast ratio 4.5:1 for normal text
4. Verify 3:1 for large text and UI components
5. Test with color blindness simulator

**Expected Results:**

- All text meets contrast requirements
- UI elements are distinguishable
- Color is not sole means of conveying info

---

## Performance & Load Testing

### Performance Tests

#### TC-PERF-001: Homepage Load Time

**Priority:** P1 (High)

**Test Steps:**

1. Clear browser cache
2. Load homepage
3. Measure metrics:
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
4. Test on slow 3G connection
5. Test with browser throttling

**Expected Results:**

- TTFB < 600ms
- FCP < 1.8s
- LCP < 2.5s
- TTI < 3.8s (on fast connection)

---

#### TC-PERF-002: Database Query Performance

**Priority:** P1 (High)

**Test Steps:**

1. Monitor database query times
2. Load events directory (query 50+ events)
3. Verify query time < 500ms
4. Test with database indexes
5. Test with 500+ events
6. Identify slow queries

**Expected Results:**

- Queries are optimized
- Indexes exist on foreign keys and frequently filtered columns
- N+1 query problems avoided
- Acceptable performance at scale

---

### Load Testing

#### TC-LOAD-001: Concurrent RSVP Load Test

**Priority:** P2 (Medium)

**Test Steps:**

1. Simulate 50 concurrent RSVP submissions to same event
2. Monitor response times
3. Verify all RSVPs process correctly
4. Verify capacity constraints enforced
5. Check for database deadlocks
6. Monitor server resources

**Expected Results:**

- System handles concurrent load
- No data corruption
- Response times remain acceptable
- Capacity never exceeded

---

#### TC-LOAD-002: Traffic Spike Simulation

**Priority:** P2 (Medium)

**Test Steps:**

1. Use load testing tool (k6, Artillery, LoadRunner)
2. Simulate 1000 concurrent users
3. Test browsing events directory
4. Test viewing event details
5. Test creating events
6. Monitor error rates
7. Monitor server resources (CPU, memory, DB connections)

**Expected Results:**

- Error rate < 1%
- Response time degrades gracefully
- No server crashes
- Vercel/infrastructure scales appropriately

---

## Security Testing

### Security Tests

#### TC-SEC-001: SQL Injection Prevention

**Priority:** P0 (Critical)

**Test Steps:**

1. Attempt SQL injection in search fields: `' OR 1=1--`
2. Attempt in form inputs
3. Test parameterized queries
4. Verify Prisma ORM protects against SQL injection
5. Test with complex injection payloads

**Expected Results:**

- All inputs are sanitized
- Parameterized queries used everywhere
- No SQL injection possible

---

#### TC-SEC-002: XSS Prevention

**Priority:** P0 (Critical)

**Test Steps:**

1. Attempt XSS in event description: `<script>alert('XSS')</script>`
2. Test with image tag: `<img src=x onerror=alert('XSS')>`
3. Submit and view event detail page
4. Verify script does not execute
5. Verify content is escaped or sanitized

**Expected Results:**

- All user input is sanitized
- React's built-in XSS protection works
- DOMPurify or similar used for rich text (if applicable)

---

#### TC-SEC-003: CSRF Protection

**Priority:** P1 (High)

**Test Steps:**

1. Verify CSRF tokens on forms (if using traditional forms)
2. Test form submission without token
3. Verify rejection
4. Test API endpoints for CSRF protection
5. Verify SameSite cookie attributes

**Expected Results:**

- CSRF protection enabled
- Unauthorized form submissions rejected
- API endpoints protected

---

#### TC-SEC-004: Authentication Bypass Attempts

**Priority:** P0 (Critical)

**Test Steps:**

1. Attempt to access curator dashboard without authentication
2. Attempt to create event without authentication
3. Attempt to edit event with manipulated JWT (if applicable)
4. Test session fixation
5. Test session hijacking prevention

**Expected Results:**

- All protected routes enforce authentication
- Cannot bypass with URL manipulation
- Sessions are secure
- JWTs are validated (if used)

---

#### TC-SEC-005: Authorization Bypass Attempts

**Priority:** P0 (Critical)

**Test Steps:**

1. User A creates event with ID 123
2. User B attempts to edit event 123 via API
3. Verify 403 Forbidden error
4. User B attempts direct URL: `/events/123/edit`
5. Verify access denied
6. Test with manipulated user IDs in requests

**Expected Results:**

- Authorization enforced at all levels
- Cannot access others' resources
- API and UI both protected
- Clear error messages (no info disclosure)

---

## Known Issues & Limitations

### Documented Limitations

1. **Events System:**
   - ~~RSVP notifications are not yet implemented~~ (Future: WPB-213)
   - Calendar integrations (.ics export) not yet implemented
   - Recurring events not supported in v1

2. **RBAC System:**
   - Role management UI pending (current: API only)
   - Permission groups not yet implemented
   - Audit log UI pending

3. **Performance:**
   - Events directory pagination needed after 100+ events
   - RSVP list pagination needed after 500+ attendees

### Blocker Issues (Must Fix Before Release)

- None currently identified (will update as testing progresses)

### Minor Issues (Can Address Post-Release)

- [ ] Event search could include venue city
- [ ] RSVP email templates need design polish
- [ ] Mobile event creation form could use UX improvements

---

## Testing Sign-off

### QA Approval Checklist

- [ ] All P0 (Critical) tests passed
- [ ] All P1 (High) tests passed
- [ ] No blocker issues remain
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Accessibility standards met
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing completed (iOS Safari, Android Chrome)
- [ ] Production build verified
- [ ] Database migrations tested
- [ ] Regression tests passed
- [ ] Documentation updated

### Test Environment Details

- **Test Database:** `piano_blog_test`
- **Test Accounts:**
  - Admin: [wallet address]
  - Curator: [wallet address]
  - Regular User: [wallet address]
- **Test Data:** Seeded via `test-seed.sql`

### Testing Timeline

- **Testing Start:** [Date]
- **Testing End:** [Date]
- **Sign-off Date:** [Date]
- **Tested By:** [Name]
- **Approved By:** [Name]

---

## Appendix

### Test Data Seed Script

```sql
-- Seed script for Sprint 2 QA testing
-- Run this to populate test database

-- Create test events
INSERT INTO "Event" (title, description, "venueId", "organizerId", "startDate", "endDate", "maxAttendees", "eventType", status, "requireApproval")
VALUES
  ('Jazz Night at Blue Note', 'Evening of live jazz performances', 1, 1, '2025-03-15 19:00', '2025-03-15 22:00', 50, 'PERFORMANCE', 'PUBLISHED', false),
  ('Classical Piano Recital', 'Mozart and Chopin', 2, 1, '2025-03-20 18:00', '2025-03-20 20:00', 100, 'RECITAL', 'PUBLISHED', true),
  ('Open Mic Night', 'Bring your talents!', 3, 2, '2025-02-10 20:00', '2025-02-10 23:00', 30, 'OPEN_MIC', 'PUBLISHED', false);

-- Create test RSVPs
INSERT INTO "EventRSVP" ("eventId", "userId", status, "attendeeCount", notes)
VALUES
  (1, 2, 'CONFIRMED', 2, 'Can''t wait!'),
  (1, 3, 'CONFIRMED', 1, ''),
  (2, 2, 'PENDING', 1, 'Hope to attend'),
  (3, 3, 'CONFIRMED', 3, 'Bringing friends');

-- Assign RBAC roles
INSERT INTO "UserRole" ("userId", role, "assignedBy")
VALUES
  (1, 'ADMIN', 1),
  (1, 'CURATOR', 1),
  (2, 'CURATOR', 1);

-- Add venue operational details
UPDATE "Venue" SET
  "operatingHours" = '{"monday": {"open": "09:00", "close": "17:00", "closed": false}, "tuesday": {"open": "09:00", "close": "17:00", "closed": false}}',
  accessibility = '{"wheelchairAccessible": true, "elevatorAccess": true}',
  ambiance = ARRAY['cozy', 'intimate']::text[]
WHERE id = 1;
```

### Useful Testing Commands

```bash
# Run local build
yarn build

# Start production server locally
yarn start

# Run type checking
yarn tsc --noEmit

# Run linting
yarn lint

# Run tests (if implemented)
yarn test

# Database commands
npx prisma migrate status
npx prisma db push
npx prisma studio
```

### Browser DevTools Tips

- **Network Tab:** Check API response times and payloads
- **Console:** Monitor for errors and warnings
- **Lighthouse:** Run performance and accessibility audits
- **React DevTools:** Inspect component state and props
- **Application Tab:** Check localStorage, cookies, service workers

---

**Document Version:** 1.0
**Last Updated:** 2025-01-30
**Maintained By:** QA Team
