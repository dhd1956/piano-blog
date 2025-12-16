-- ============================================================================
-- RLS Quick Start - Immediate Security Fixes
-- ============================================================================
--
-- This script enables RLS on the most critical tables with basic policies.
-- Run this FIRST to fix immediate security issues, then gradually apply
-- the full rls-policies.sql for comprehensive protection.
--
-- Estimated time: < 30 seconds to run
-- ============================================================================

-- STEP 1: Block system table (CRITICAL - fixes your current security warning)
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- STEP 2: Protect authentication tables (CRITICAL)
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own sessions only"
  ON public."Session"
  FOR ALL
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      OR "username" = auth.jwt() ->> 'username'
    )
  );

-- STEP 3: Protect admin configuration (CRITICAL)
ALTER TABLE public."AppConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only blog owner accesses config"
  ON public."AppConfig"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role = 'BLOG_OWNER'
    )
  );

-- STEP 4: Enable RLS on User table (IMPORTANT)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable"
  ON public."User"
  FOR SELECT
  USING (
    "publicProfile" = true
    OR "walletAddress" = auth.jwt() ->> 'walletAddress'
    OR "username" = auth.jwt() ->> 'username'
  );

CREATE POLICY "Users update own profile"
  ON public."User"
  FOR UPDATE
  USING (
    "walletAddress" = auth.jwt() ->> 'walletAddress'
    OR "username" = auth.jwt() ->> 'username'
  );

-- ============================================================================
-- QUICK START COMPLETE
-- ============================================================================
--
-- ✅ What's now protected:
--    - _prisma_migrations (your original security warning)
--    - Session (authentication tokens)
--    - AppConfig (admin settings)
--    - User (basic profile protection)
--
-- ⚠️  Next steps:
--    1. Test your app - ensure login/profile viewing still works
--    2. Review and run the full rls-policies.sql for complete protection
--    3. Enable RLS on remaining tables: Venue, Event, VenueReview, etc.
--
-- ============================================================================
