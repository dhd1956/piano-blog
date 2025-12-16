# Row Level Security (RLS) Implementation Guide

## Overview

This guide helps you implement Row Level Security (RLS) for your Piano Blog database to fix the Supabase security warning and protect all your tables.

## 🚨 Security Issue

**Current Problem**: Your `_prisma_migrations` table (and potentially others) are publicly accessible through PostgREST without RLS protection.

**Risk Level**: Medium - While `_prisma_migrations` doesn't contain sensitive data, it's exposed publicly and indicates other tables may lack protection.

---

## 📋 Implementation Options

### Option 1: Quick Fix (5 minutes) ⚡

**Best for**: Immediate security fixes for critical tables

```bash
# Run in Supabase SQL Editor
cat prisma/rls-quick-start.sql
```

**What it fixes:**

- ✅ `_prisma_migrations` (your current warning)
- ✅ `Session` (auth tokens)
- ✅ `AppConfig` (admin settings)
- ✅ `User` (basic protection)

**Remaining work**: Enable RLS on Venue, Event, Review tables later

---

### Option 2: Comprehensive Protection (20 minutes) 🛡️

**Best for**: Complete security implementation

```bash
# Run in Supabase SQL Editor
cat prisma/rls-policies.sql
```

**What it fixes:**

- ✅ All 16 tables with appropriate policies
- ✅ Role-based access control (SCOUT, CURATOR, VALIDATOR, BLOG_OWNER)
- ✅ Public read for appropriate tables (Venue, Event)
- ✅ User-specific write permissions
- ✅ Protected admin/curator tables

---

## 🔧 Step-by-Step Implementation

### Phase 1: Pre-Implementation Checklist

1. **Backup your database** (Supabase auto-backups, but verify)
2. **Check current RLS status**:
   ```sql
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```
3. **Understand your auth setup**: How do you identify users?
   - Wallet address in JWT? (`auth.jwt() ->> 'walletAddress'`)
   - Username? (`auth.jwt() ->> 'username'`)
   - Supabase User UUID? (`auth.uid()`)

### Phase 2: Choose Your Approach

#### Approach A: Gradual Rollout (Recommended for Production)

Roll out RLS table-by-table to minimize risk:

**Step 1**: System tables (safest, no user impact)

```sql
-- Copy just the _prisma_migrations section from rls-policies.sql
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
```

**Step 2**: Authentication tables

```sql
-- Session and User tables
-- Copy from rls-policies.sql sections
```

**Step 3**: Content tables (test thoroughly)

```sql
-- Venue, Event, VenueReview
-- Copy from rls-policies.sql sections
```

**Step 4**: Admin/Analytics tables

```sql
-- AppConfig, VenueAnalytics, BlockchainEvent
-- Copy from rls-policies.sql sections
```

#### Approach B: All at Once (Safe for Development/Staging)

```bash
# In Supabase SQL Editor, paste entire contents of:
cat prisma/rls-policies.sql

# Execute all at once
```

### Phase 3: Verify Implementation

**Check RLS is enabled on all tables:**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false; -- Should return no rows (except pg_ system tables)
```

**View all active policies:**

```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Count policies per table:**

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### Phase 4: Testing

Test with different user contexts:

#### Test 1: Anonymous User (No Auth)

```sql
-- Set role to anonymous
SET ROLE anon;

-- Try to read venues (should work for public venues)
SELECT * FROM public."Venue" WHERE verified = true LIMIT 5;

-- Try to read users (should only see public profiles)
SELECT * FROM public."User" WHERE "publicProfile" = true LIMIT 5;

-- Try to read sessions (should fail)
SELECT * FROM public."Session" LIMIT 1; -- Expected: no rows or error

-- Reset role
RESET ROLE;
```

#### Test 2: Authenticated Scout

```sql
-- In your app, login as a SCOUT user
-- Try these operations:

-- ✅ Should work: Submit a venue
-- ✅ Should work: Create an event
-- ✅ Should work: Write a review
-- ❌ Should fail: Update another user's venue
-- ❌ Should fail: Access AppConfig
```

#### Test 3: Curator/Validator

```sql
-- Login as CURATOR
-- ✅ Should work: Create VenueVerification
-- ✅ Should work: Update any venue
-- ✅ Should work: View VenueAnalytics
```

#### Test 4: Blog Owner

```sql
-- Login as BLOG_OWNER
-- ✅ Should work: Everything (all CRUD operations)
```

### Phase 5: Monitor and Adjust

**Watch for these issues:**

1. **Slow queries**: RLS policies add WHERE clauses
   - Check execution plans: `EXPLAIN ANALYZE SELECT ...`
   - Verify indexes exist (already in your schema.prisma)

2. **Permission errors**: Users can't access expected data
   - Check JWT claims match policy conditions
   - Verify User.role is set correctly

3. **Service role operations**: Backend tasks may need service role key
   - Blockchain listeners should use service role
   - Admin scripts should use service role
   - Service role bypasses RLS entirely

---

## 🔑 Authentication Configuration

### Critical: JWT Claims Setup

Your RLS policies assume JWT tokens contain these claims:

```typescript
// Expected JWT structure
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "username": "john_doe", // For non-Web3 users
  "role": "authenticated"
}
```

**If your JWT structure is different**, you must modify the policies:

#### Option A: Using Supabase User UUID (Standard)

Replace all instances of:

```sql
auth.jwt() ->> 'walletAddress'
```

With:

```sql
auth.uid()
```

And add a `supabaseUserId` column to your User table:

```prisma
model User {
  supabaseUserId String? @unique
  // ... rest of fields
}
```

#### Option B: Custom JWT Claims (Your Current Setup)

Ensure your Supabase Auth hooks or custom auth provider sets these claims:

```javascript
// Supabase Auth Hook example
export async function enrichJWT(event) {
  const user = await prisma.user.findUnique({
    where: { id: event.user.id },
  })

  return {
    ...event,
    claims: {
      walletAddress: user.walletAddress,
      username: user.username,
    },
  }
}
```

---

## 📊 Tables by Security Level

### 🔴 Critical Protection (Enable First)

- `_prisma_migrations` - System migrations
- `Session` - Auth tokens
- `AppConfig` - Admin settings
- `User` - User profiles (partial public read)

### 🟡 Important Protection

- `Venue` - Venue submissions (public read, restricted write)
- `Event` - Events (public read if isPublic=true)
- `VenueReview` - Reviews (public read, user write)
- `EventRSVP` - Event attendance (user-specific)

### 🟢 Optional Protection (Can defer)

- `VenueAnalytics` - Analytics data (low sensitivity)
- `PXPPayment` - Payment records (blockchain transparency)
- `BlockchainEvent` - Event log (public blockchain data)

### 🔵 Admin Only

- `VenueVerification` - Curator actions
- `VenueValidation` - Validator votes
- `AppConfig` - Site configuration

---

## 🚨 Troubleshooting

### Issue: "Query returned no rows" after enabling RLS

**Cause**: Policy is too restrictive or JWT claims missing

**Fix**:

1. Check JWT claims: `SELECT auth.jwt();` in SQL Editor
2. Verify User.role is set: `SELECT role FROM "User" WHERE walletAddress = 'YOUR_ADDRESS';`
3. Temporarily disable RLS to test: `ALTER TABLE "TableName" DISABLE ROW LEVEL SECURITY;`

### Issue: "Permission denied for table X"

**Cause**: No SELECT policy exists for anonymous/authenticated role

**Fix**: Add a SELECT policy or use service role for backend operations

### Issue: Slow queries after enabling RLS

**Cause**: RLS adds complex WHERE clauses that may not use indexes

**Fix**:

1. Check execution plan: `EXPLAIN ANALYZE SELECT ...`
2. Add composite indexes if needed
3. Consider materialized views for complex public data

### Issue: Service role operations failing

**Cause**: You're using the anon key instead of service role key

**Fix**: Use service role key for:

- Blockchain event listeners
- Admin scripts
- Scheduled jobs

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Your schema: `prisma/schema.prisma`
- Full policies: `prisma/rls-policies.sql`
- Quick start: `prisma/rls-quick-start.sql`

---

## ✅ Post-Implementation Checklist

- [ ] RLS enabled on all public tables
- [ ] Policies tested with anonymous users
- [ ] Policies tested with authenticated users (each role)
- [ ] Service role configured for backend operations
- [ ] Query performance verified (no significant slowdown)
- [ ] Application tested end-to-end
- [ ] Security warning in Supabase dashboard resolved
- [ ] Documentation updated for team
- [ ] Monitoring set up for RLS-related errors

---

## 🎯 Quick Reference: Common Policy Patterns

### Public Read, User Write

```sql
-- SELECT: Everyone
CREATE POLICY "name" ON "Table" FOR SELECT USING (true);

-- INSERT: Authenticated only
CREATE POLICY "name" ON "Table" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Own records only
CREATE POLICY "name" ON "Table" FOR UPDATE
  USING ("userId" = auth.uid());
```

### Role-Based Access

```sql
CREATE POLICY "name" ON "Table" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'CURATOR')
    )
  );
```

### Owner + Admin Access

```sql
CREATE POLICY "name" ON "Table" FOR UPDATE
  USING (
    "ownerId" = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
```

---

**Need help?** Check the comments in `rls-policies.sql` or create an issue in your repo.
