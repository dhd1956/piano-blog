# WPB-112: Availability & Collaboration - Badge Analysis

## User Request

Elaborate on badges referenced in WPB-112 acceptance criteria. Explain what is available now and what still needs to be implemented.

---

## Executive Summary

**WPB-112 Status: 60% Complete**

- ✅ Core availability toggles implemented (Paid Gigs, Collaborations)
- 🟡 Badge display implemented (simple checkmark badges, not achievement-style badges)
- ❌ Jam Sessions toggle completely missing (database field missing)
- ❌ Filtering by availability not implemented
- ✅ Availability notes field implemented

---

## Badge Requirements (From Acceptance Criteria)

### What "Badges" Means in WPB-112

According to the JIRA acceptance criteria and sprint documentation, "badges" refers to:

1. **Visual Indicators on Profile** - Checkmark badges showing availability status
2. **Availability Labels** - Color-coded badges for different availability types
3. **Musician Card Badges** - Compact badges in directory listings

**NOT referring to:**

- Achievement badges (separate feature)
- Profile completeness indicators (separate feature)
- Skill level badges (separate feature)

---

## Current Implementation: What's Available Now

### 1. ✅ Database Schema (Partial)

**File**: `prisma/schema.prisma` (Lines 439-441)

```prisma
availableForGigs    Boolean  @default(false)  // ✅ Implemented
availableForJams    Boolean  @default(true)   // ❌ MISSING
availableForCollab  Boolean  @default(false)  // ✅ Implemented
availabilityNotes   String?  @db.Text         // ✅ Implemented
```

**Status**: 75% complete (3 of 4 fields)

---

### 2. ✅ Profile Display Badges

**File**: `app/profile/[address]/page.tsx` (Lines 568-596)

**Available Badge Types:**

#### a) Paid Gigs Badge (Green)

```tsx
<span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
  <span className="text-green-600">✓</span>
  Available for Paid Gigs
</span>
```

- **Color**: Green background, green checkmark
- **Display**: Only shown when `availableForGigs === true`
- **Location**: Profile page, Availability section

#### b) Collaborations Badge (Blue)

```tsx
<span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
  <span className="text-blue-600">✓</span>
  Available for Collaborations
</span>
```

- **Color**: Blue background, blue checkmark
- **Display**: Only shown when `availableForCollab === true`
- **Location**: Profile page, Availability section

#### c) Availability Notes Display

```tsx
<div className="mt-3 rounded-md bg-gray-50 p-3">
  <p className="text-sm text-gray-700">{musicianProfile.availabilityNotes}</p>
</div>
```

- **Display**: Optional text box with gray background
- **Content**: User-provided availability details
- **Example**: "Available weekends only", "Touring March-June"

---

### 3. ✅ Edit Form Toggles

**File**: `app/profile/[address]/edit/page.tsx` (Lines 651-691)

**Available Toggles:**

```tsx
// Paid Gigs Toggle
<label className="flex items-center">
  <input type="checkbox" checked={availableForGigs} ... />
  <span>Available for Paid Gigs</span>
</label>

// Collaborations Toggle
<label className="flex items-center">
  <input type="checkbox" checked={availableForCollab} ... />
  <span>Available for Collaborations</span>
</label>

// Notes Field
<textarea value={availabilityNotes} rows={3} ... />
```

**Status**: ✅ Fully functional for 2 of 3 availability types

---

### 4. ✅ Musicians Directory Badges

**File**: `app/musicians/page.tsx` (Lines 274-288)

**Compact Card Badges:**

```tsx
{
  profile.availableForGigs && (
    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">✓ Gigs</span>
  )
}

{
  profile.availableForCollab && (
    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">✓ Collabs</span>
  )
}
```

**Status**: ✅ Shows availability at a glance in musician listings

---

## Missing Implementation: What Needs to Be Done

### 1. ❌ CRITICAL: Jam Sessions Badge (Complete Missing)

**Database Field Missing:**

```prisma
// NEEDS TO BE ADDED:
availableForJams Boolean @default(true)
```

**Edit Form Missing:**

```tsx
// NEEDS TO BE ADDED (between gigs and collab):
<label className="flex items-center">
  <input type="checkbox" checked={availableForJams} ... />
  <span>Open to Jam Sessions</span>
</label>
```

**Display Badge Missing:**

```tsx
// NEEDS TO BE ADDED:
{
  musicianProfile.availableForJams && (
    <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800">
      <span className="text-purple-600">✓</span>
      Open to Jam Sessions
    </span>
  )
}
```

**Musician Card Badge Missing:**

```tsx
// NEEDS TO BE ADDED:
{
  profile.availableForJams && (
    <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">✓ Jams</span>
  )
}
```

**Impact**: Users cannot indicate or search for jam session opportunities

---

### 2. ❌ CRITICAL: Filtering by Availability

**Acceptance Criteria**: "Filter musicians by availability"

**Current State**: No filtering capability exists

**What Needs to Be Added:**

#### a) UI Filter Controls

**Location**: `app/musicians/page.tsx`

```tsx
// NEEDS TO BE ADDED: Filter section
<div className="mb-6 flex gap-3">
  <button onClick={() => toggleFilter('gigs')} className={filterActive('gigs') ? 'active' : ''}>
    🎸 Available for Gigs
  </button>

  <button onClick={() => toggleFilter('jams')} className={filterActive('jams') ? 'active' : ''}>
    🎹 Open to Jams
  </button>

  <button
    onClick={() => toggleFilter('collabs')}
    className={filterActive('collabs') ? 'active' : ''}
  >
    🤝 Open to Collabs
  </button>
</div>
```

#### b) API Query Parameters

**File**: `app/api/musicians/route.ts` (or create if missing)

```typescript
// NEEDS TO BE ADDED: Support filter params
const { searchParams } = new URL(request.url)
const filterGigs = searchParams.get('availableForGigs') === 'true'
const filterJams = searchParams.get('availableForJams') === 'true'
const filterCollabs = searchParams.get('availableForCollab') === 'true'

// Apply filters to query
const where = {
  ...(filterGigs && { availableForGigs: true }),
  ...(filterJams && { availableForJams: true }),
  ...(filterCollabs && { availableForCollab: true }),
}
```

**Impact**: Cannot find musicians by specific availability needs

---

### 3. 🟡 ENHANCEMENT: Availability-Specific Badges (Nice to Have)

**Current**: Uses generic checkmark badges
**Enhancement**: Could create dedicated badge component

**Potential Component**: `components/profile/AvailabilityBadge.tsx`

```tsx
interface AvailabilityBadgeProps {
  type: 'gigs' | 'jams' | 'collabs'
  active: boolean
}

// Could have:
// - Icons for each type (💰 for gigs, 🎹 for jams, 🤝 for collabs)
// - Consistent styling
// - Hover states with tooltips
// - Click to filter behavior
```

**Priority**: Low (current implementation is functional)

---

## Implementation Roadmap

### Phase 1: Complete Core Features (CRITICAL)

**1. Add Jam Sessions Support** (30 minutes)

- [ ] Add `availableForJams` field to Prisma schema
- [ ] Run migration: `npx prisma db push`
- [ ] Add jam sessions toggle to edit form
- [ ] Add jam sessions badge to profile display
- [ ] Add jam sessions badge to musician cards

**2. Implement Filtering** (2 hours)

- [ ] Add filter UI controls to musicians page
- [ ] Add state management for filters
- [ ] Update API to support availability filters
- [ ] Wire up filter buttons to API calls
- [ ] Show active filter state

### Phase 2: Polish (OPTIONAL)

**3. Create Dedicated Badge Component** (1 hour)

- [ ] Extract badge logic to reusable component
- [ ] Add consistent styling and icons
- [ ] Add hover tooltips
- [ ] Improve accessibility

---

## Files That Need Modification

### Critical Files:

1. **prisma/schema.prisma** - Add `availableForJams` field
2. **app/profile/[address]/edit/page.tsx** - Add jam sessions toggle
3. **app/profile/[address]/page.tsx** - Add jam sessions badge display
4. **app/musicians/page.tsx** - Add filter UI and musician card jam badge
5. **app/api/musicians/route.ts** - Add filtering logic (or create if missing)

### Optional Files:

6. **components/profile/AvailabilityBadge.tsx** - New component (enhancement)

---

## Acceptance Criteria Status

| Criterion                             | Status     | Evidence                               |
| ------------------------------------- | ---------- | -------------------------------------- |
| Toggle "Available for Paid Gigs"      | ✅ DONE    | edit page L.656-664, display L.576-580 |
| Toggle "Open to Jam Sessions"         | ❌ MISSING | No database field, no UI               |
| Toggle "Available for Collaborations" | ✅ DONE    | edit page L.666-674, display L.582-586 |
| Display badges on profile             | ✅ DONE    | display L.568-596 (checkmark badges)   |
| Filter musicians by availability      | ❌ MISSING | No filter UI or API logic              |
| Availability notes field              | ✅ DONE    | edit page L.677-690, display L.589-593 |
| Display on musician cards             | 🟡 PARTIAL | Done for gigs/collabs, missing jams    |

**Overall Completion: 60%**

---

## Summary: What You Have vs What You Need

### ✅ What You Have (Working Right Now)

1. **Green "Available for Paid Gigs" badge** - Shows on profile and musician cards
2. **Blue "Available for Collaborations" badge** - Shows on profile and musician cards
3. **Availability notes field** - Optional text for details
4. **Edit toggles** - Users can enable/disable gigs and collabs
5. **Database storage** - Persists gigs and collab availability

### ❌ What You're Missing (To Complete WPB-112)

1. **Purple "Open to Jam Sessions" badge** - No database field, no UI anywhere
2. **Filter musicians by availability** - Can't search for available musicians
3. **Jam sessions toggle** - Can't enable/disable jam session availability

### 🎯 To Reach 100% Completion

**Required Work:**

- Add 1 database field (`availableForJams`)
- Add 3 UI toggles/badges for jam sessions
- Build filtering system with UI controls and API logic

**Estimated Effort:** 3-4 hours

---

## Recommendation

**Start with Phase 1 (Critical Features)** to complete WPB-112 acceptance criteria:

1. Add jam sessions support (quick win, 30 min)
2. Implement filtering (core feature, 2 hours)
3. Defer badge component enhancement (nice-to-have)

This will bring WPB-112 to 100% completion.
