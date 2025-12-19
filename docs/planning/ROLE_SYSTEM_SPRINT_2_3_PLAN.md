# Role System Analysis & Implementation Plan

## Piano Blog - Sprint 2/3 Roadmap

---

## Executive Summary

The Piano Blog application has a **well-designed RBAC (Role-Based Access Control) system** defined in the database schema, but **implementation is incomplete and inconsistent** across the codebase. Three separate authorization mechanisms coexist:

1. **Role-based system** (modern, partially implemented)
2. **Wallet address checks** (legacy Web3 approach)
3. **Boolean flags** (`isAuthorizedVerifier` - blockchain cache)

This document analyzes the current state and provides a roadmap for proper role-based implementation in Sprint 2/3.

---

## Current State: How Roles Work Now

### 1. Role Definitions (Schema)

**Location:** `prisma/schema.prisma` (lines 537-542)

```prisma
enum UserRole {
  BLOG_OWNER  // Full CRUD, instant verification
  CURATOR     // Edit venues, no verification power
  VALIDATOR   // Vote to verify venues (3 required)
  SCOUT       // Create venues, read all (default role)
}
```

**Status:** ✅ Properly defined with clear responsibilities

### 2. Role Assignment

| Method            | Role Assigned                      | Location                          |
| ----------------- | ---------------------------------- | --------------------------------- |
| New user signup   | `SCOUT` (default)                  | `app/api/auth/signup/route.ts:89` |
| Wallet connection | `SCOUT` (default)                  | `lib/auth.ts:220`                 |
| Admin creation    | `CURATOR`, `VALIDATOR`, or `SCOUT` | `app/api/admin/users/route.ts`    |
| Blog owner        | Manual (env variable)              | Not in database                   |

**Issues:**

- ❌ Blog owner role not properly assigned in database
- ❌ No UI to assign VALIDATOR role
- ❌ Curator role assignment uses `isAuthorizedVerifier` flag instead of role field

### 3. Permission Enforcement (Mixed)

#### ✅ WORKING: Role-Based Middleware

**Location:** `lib/auth-middleware.ts`

```typescript
// Properly enforced with requireRole()
requireRole(request, [UserRole.CURATOR, UserRole.BLOG_OWNER])
```

**Used correctly in:**

- ✅ Venue editing (`PUT /api/venues/[id]`)
- ✅ Venue deletion (`DELETE /api/venues/[id]`)
- ✅ Venue validation (`POST /api/venues/[id]/validate`)
- ✅ User management (`/api/admin/users`)

#### ❌ BROKEN: Wallet Address Checks

**Instead of using roles, these endpoints check wallet addresses:**

```typescript
// Legacy approach - bypasses role system
const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS
const isBlogOwner = walletAddress === blogOwnerAddress
```

**Used incorrectly in:**

- ❌ Curator management (`/api/admin/curators`)
- ❌ Event management (`/api/events/[id]`)
- ❌ Permission API (`/api/auth/permissions`)
- ❌ Profile management (partial)

#### ❌ BROKEN: Boolean Flag System

**The curator system uses `isAuthorizedVerifier` instead of checking `UserRole.CURATOR`:**

```typescript
// Wrong approach
const user = await prisma.user.findUnique({
  where: { walletAddress },
  select: { isAuthorizedVerifier: true }, // Should check role!
})
```

**Problems:**

- Duplicate authorization systems
- `isAuthorizedVerifier` flag disconnected from role field
- Frontend checks flag, backend checks role → inconsistency

---

## Current Workflow Analysis

### Venue Submission

- **Who:** Anyone (no restrictions)
- **API:** `POST /api/venues`
- **Check:** None - anonymous allowed
- **Status:** ✅ Working as intended (community-driven)

### Venue Verification (Curator Path)

- **Who:** Users with `isAuthorizedVerifier: true` flag
- **API:** `PUT /api/venues/[id]` (with `verified` field update)
- **Check:** `requireRole([UserRole.CURATOR, UserRole.BLOG_OWNER])`
- **Issue:** ⚠️ Frontend checks flag, backend checks role (mismatch!)

### Venue Verification (Validator Path)

- **Who:** Users with `UserRole.VALIDATOR`
- **API:** `POST /api/venues/[id]/validate`
- **Check:** `requireRole([UserRole.VALIDATOR, UserRole.BLOG_OWNER])`
- **Issue:** ❌ NO FRONTEND UI - API exists but validators can't access it

### Curator Management

- **Who:** Blog owner (wallet address check)
- **API:** `/api/admin/curators`
- **Check:** `walletAddress === BLOG_OWNER_ADDRESS` (not role!)
- **Action:** Sets `isAuthorizedVerifier: true` (not role!)
- **Issue:** ❌ Bypasses entire role system

---

## Critical Gaps Summary

| Feature                   | Expected             | Current Reality             | Priority |
| ------------------------- | -------------------- | --------------------------- | -------- |
| Blog owner identification | `role: BLOG_OWNER`   | Wallet address env var      | HIGH     |
| Curator identification    | `role: CURATOR`      | `isAuthorizedVerifier` flag | HIGH     |
| Curator assignment        | Set role to CURATOR  | Sets boolean flag           | HIGH     |
| Validator UI              | Dashboard for voting | No UI exists                | MEDIUM   |
| Role management UI        | Assign any role      | Only curator flag           | MEDIUM   |
| Permission consistency    | Use roles everywhere | Mixed wallet/flag/role      | HIGH     |

---

## Sprint 2/3 Implementation Plan

### Sprint 2: Core RBAC Consolidation

**Goal:** Unify authorization around the role system

#### Task 2.1: Migrate Blog Owner to Role-Based

**Effort:** 3 story points

**Changes:**

1. Update blog owner user in database to have `role: BLOG_OWNER`
2. Modify `isBlogOwner()` in `lib/auth-middleware.ts` to check role first, wallet address as fallback
3. Add database migration to set blog owner role

**Files:**

- `lib/auth-middleware.ts`
- `prisma/migrations/XXX_set_blog_owner_role.sql`
- `.env.example` (document blog owner setup)

**Acceptance criteria:**

- Blog owner can access all features using role alone
- Wallet address check remains as backup for legacy support
- Tests pass for blog owner permissions

---

#### Task 2.2: Migrate Curator System to Role-Based

**Effort:** 5 story points

**Changes:**

1. Update `/api/admin/curators` to set `role: CURATOR` instead of `isAuthorizedVerifier`
2. Update permissions API to check role instead of flag
3. Add database migration to sync existing curators: `UPDATE User SET role = 'CURATOR' WHERE isAuthorizedVerifier = true`
4. Deprecate `isAuthorizedVerifier` flag (mark for removal in future sprint)
5. Update frontend `usePermissions()` hook to check role from session

**Files:**

- `app/api/admin/curators/route.ts`
- `app/api/admin/curators/[address]/route.ts`
- `app/api/auth/permissions/route.ts`
- `components/web3/WorkingWeb3Provider.tsx`
- `hooks/useWallet.ts`
- `prisma/migrations/XXX_migrate_curators_to_role.sql`

**Acceptance criteria:**

- Existing curators maintain access after migration
- New curators added via `/admin/curators` get proper role
- Frontend curator checks use role, not flag
- Permission API returns role-based permissions

---

#### Task 2.3: Add Role Management UI

**Effort:** 5 story points

**New page:** `/admin/roles` (replaces `/admin/curators`)

**Features:**

- List all users with their current roles
- Assign any role (SCOUT, CURATOR, VALIDATOR, BLOG_OWNER) to users
- Search/filter by role, username, wallet address
- Role change audit log

**Files (new):**

- `app/admin/roles/page.tsx`
- `app/api/admin/roles/route.ts`
- `app/api/admin/roles/[userId]/route.ts`

**Files (modify):**

- `data/headerNavLinks.ts` (add admin menu link)
- `lib/auth-middleware.ts` (add role change permissions)

**Acceptance criteria:**

- Blog owner can assign any role to any user
- Role changes are logged to database
- UI shows current role assignments
- Role-based access control applies to this page

---

### Sprint 3: Validator UI & Advanced Features

#### Task 3.1: Implement Validator Dashboard

**Effort:** 8 story points

**New page:** `/validator` (similar to `/curator`)

**Features:**

- List pending venues awaiting validation
- Vote approve/reject with notes and rating
- View vote progress (X/3 validators voted)
- Auto-verify when 3 approvals reached
- Show validation history

**Files (new):**

- `app/validator/page.tsx`
- `components/validator/ValidatorDashboard.tsx`
- `components/validator/VenueVoteCard.tsx`

**Files (modify):**

- `app/api/venues/[id]/validate/route.ts` (already exists, just connect UI)
- `data/headerNavLinks.ts` (add validator menu link)

**Acceptance criteria:**

- Users with VALIDATOR role can access dashboard
- 3 validator approvals auto-verifies venue
- Blog owner can instant-verify (bypass)
- Vote history tracked in database

---

#### Task 3.2: Per-Venue Curator Assignment (Optional)

**Effort:** 8 story points

**Note:** This is an **architectural change** - current system has global curators. This task implements venue-specific curators if desired.

**Database change:**

```prisma
model VenueCurator {
  id       Int      @id @default(autoincrement())
  venueId  Int
  userId   Int
  venue    Venue    @relation(...)
  user     User     @relation(...)
  assignedBy String  // Blog owner who assigned
  assignedAt DateTime @default(now())

  @@unique([venueId, userId])
}
```

**UI changes:**

- Add "Assign Curator" button on venue details page (blog owner only)
- Show assigned curators on venue page
- Curators only see venues they're assigned to in dashboard

**Files:**

- `prisma/schema.prisma` (add VenueCurator model)
- `prisma/migrations/XXX_add_venue_curators.sql`
- `app/venueDetails/[id]/page.tsx` (assign curator UI)
- `app/curator/page.tsx` (filter to assigned venues)
- `app/api/venues/[id]/curators/route.ts` (new endpoint)

**Acceptance criteria:**

- Blog owner can assign curators to specific venues
- Curators see only their assigned venues
- Global curators (role-based) see all venues
- Assignment tracked with audit trail

---

#### Task 3.3: Role-Based Feature Flags

**Effort:** 3 story points

**Goal:** Clean up feature access based on roles

**Changes:**

1. Create role configuration file defining feature access
2. Update navigation menu to show/hide based on role
3. Add role-based feature flags for:
   - Curator dashboard visibility
   - Validator dashboard visibility
   - Admin panel access
   - Advanced venue editing
   - PXP reward management

**Files:**

- `lib/role-config.ts` (new)
- `components/navigation/Navigation.tsx`
- `data/headerNavLinks.ts`

**Acceptance criteria:**

- Menu items show/hide based on user role
- Unauthorized users cannot access role-restricted pages
- Feature flags are centralized and maintainable

---

## Migration Strategy

### Phase 1: Database Migration (Sprint 2 Start)

```sql
-- Step 1: Sync existing curators to role
UPDATE "User"
SET role = 'CURATOR'
WHERE "isAuthorizedVerifier" = true
  AND role != 'BLOG_OWNER';

-- Step 2: Set blog owner role (replace with actual address)
UPDATE "User"
SET role = 'BLOG_OWNER'
WHERE "walletAddress" = '0x...' -- NEXT_PUBLIC_BLOG_OWNER_ADDRESS

-- Step 3: Verify no data loss
SELECT username, role, "isAuthorizedVerifier"
FROM "User"
WHERE role IN ('CURATOR', 'BLOG_OWNER');
```

### Phase 2: Code Migration (Sprint 2)

1. Deploy role-based curator system
2. Test with existing curators
3. Monitor for permission issues
4. Keep `isAuthorizedVerifier` as read-only backup for 1 sprint

### Phase 3: Cleanup (Sprint 3 End)

1. Remove `isAuthorizedVerifier` flag from schema
2. Remove wallet address checks (keep in middleware as fallback only)
3. Archive legacy authorization code

---

## Testing Strategy

### Unit Tests Needed

- `lib/auth-middleware.ts` role checks
- Permission helpers (`can.*` functions)
- Role assignment API endpoints

### Integration Tests Needed

- Curator workflow (assign role → access dashboard → verify venue)
- Validator workflow (assign role → access dashboard → vote)
- Role-based page access restrictions

### Manual Testing Checklist

- [ ] Blog owner can access all features
- [ ] Curators can edit and verify venues
- [ ] Validators can vote on venues (Sprint 3)
- [ ] Scouts can only submit venues
- [ ] Unauthorized users blocked from admin pages
- [ ] Role changes take effect immediately
- [ ] Existing curators maintain access after migration

---

## Risk Assessment

| Risk                          | Impact   | Mitigation                                        |
| ----------------------------- | -------- | ------------------------------------------------- |
| Existing curators lose access | HIGH     | Test migration script thoroughly, backup database |
| Blog owner locked out         | CRITICAL | Keep wallet address as fallback, document env var |
| Permission holes              | MEDIUM   | Comprehensive test suite, security audit          |
| Breaking change for frontend  | MEDIUM   | Deploy backend first, staged rollout              |

---

## Success Metrics

**Sprint 2 Goals:**

- [ ] 100% of curator checks use role system
- [ ] 0 wallet address checks in non-middleware code
- [ ] All existing curators migrated successfully
- [ ] Role management UI deployed and functional

**Sprint 3 Goals:**

- [ ] Validator dashboard operational with 3+ active validators
- [ ] Per-venue curator assignment (if approved)
- [ ] Role-based feature flags implemented
- [ ] `isAuthorizedVerifier` flag removed from schema

---

## Files to Modify

### High Priority (Sprint 2)

- `lib/auth-middleware.ts` - Core permission logic
- `app/api/admin/curators/route.ts` - Migrate to role-based
- `app/api/admin/curators/[address]/route.ts` - Migrate to role-based
- `app/api/auth/permissions/route.ts` - Return role-based permissions
- `components/web3/WorkingWeb3Provider.tsx` - Check roles not flags
- `prisma/migrations/` - Add migration scripts

### Medium Priority (Sprint 2-3)

- `app/admin/roles/page.tsx` - New role management UI
- `app/api/admin/roles/route.ts` - New role management API
- `app/api/events/[id]/route.ts` - Remove wallet checks
- `hooks/useWallet.ts` - Update permission hooks
- `data/headerNavLinks.ts` - Role-based navigation

### Low Priority (Sprint 3)

- `app/validator/page.tsx` - New validator dashboard
- `components/validator/*` - Validator UI components
- `lib/role-config.ts` - Feature flag configuration
- `prisma/schema.prisma` - Remove deprecated flags (end of Sprint 3)

---

## Conclusion

The Piano Blog has a **solid foundation** for RBAC but needs **consistent implementation** across the stack. The current system works but is fragmented across three authorization approaches.

**Sprint 2** focuses on **consolidation** - migrating everything to the role-based system.
**Sprint 3** adds **advanced features** - validator UI and optional per-venue curator assignment.

**Estimated Total Effort:**

- Sprint 2: 13 story points (2-3 weeks)
- Sprint 3: 19 story points (3-4 weeks)

**Recommended Approach:** Implement Sprint 2 first and validate with users before proceeding to Sprint 3 features.
