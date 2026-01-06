-- ============================================================================
-- Row Level Security (RLS) Policies for PXPConfig and GasSponsoredTransaction
-- Generated: 2025-01-05
-- ============================================================================
--
-- Run this in Supabase SQL Editor to enable RLS on config and gas tables
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PXPConfig: Public read (transparent rewards), admin-only write
-- ----------------------------------------------------------------------------
ALTER TABLE public."PXPConfig" ENABLE ROW LEVEL SECURITY;

-- Everyone can view PXP reward configurations (transparency)
CREATE POLICY "PXP reward configs are viewable by everyone"
  ON public."PXPConfig"
  FOR SELECT
  USING (true);

-- Only blog owner can create new reward configurations
CREATE POLICY "Only blog owner can create PXP configs"
  ON public."PXPConfig"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role = 'BLOG_OWNER'
    )
  );

-- Only blog owner can update reward configurations
CREATE POLICY "Only blog owner can update PXP configs"
  ON public."PXPConfig"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role = 'BLOG_OWNER'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role = 'BLOG_OWNER'
    )
  );

-- Only blog owner can delete reward configurations
CREATE POLICY "Only blog owner can delete PXP configs"
  ON public."PXPConfig"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role = 'BLOG_OWNER'
    )
  );

-- ----------------------------------------------------------------------------
-- GasSponsoredTransaction: Users view own, admins view all
-- ----------------------------------------------------------------------------
ALTER TABLE public."GasSponsoredTransaction" ENABLE ROW LEVEL SECURITY;

-- Users can view their own gas-sponsored transactions
CREATE POLICY "Users can view their own gas transactions"
  ON public."GasSponsoredTransaction"
  FOR SELECT
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
    OR "userAddress" = auth.jwt() ->> 'walletAddress'
  );

-- Admins and curators can view all gas transactions (for monitoring/analytics)
CREATE POLICY "Admins can view all gas transactions"
  ON public."GasSponsoredTransaction"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role IN ('BLOG_OWNER', 'CURATOR')
    )
  );

-- Gas transaction creation is handled by backend (service role)
-- No client-side INSERT policy needed

-- Users can update their own transaction metadata (if needed)
CREATE POLICY "Users can update their own gas transaction metadata"
  ON public."GasSponsoredTransaction"
  FOR UPDATE
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  )
  WITH CHECK (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

-- Only blog owner can delete gas transaction records
CREATE POLICY "Only blog owner can delete gas transactions"
  ON public."GasSponsoredTransaction"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role = 'BLOG_OWNER'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Run this to verify RLS is enabled on both tables:
/*
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('PXPConfig', 'GasSponsoredTransaction')
ORDER BY tablename;
*/

-- Run this to view all policies for these tables:
/*
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('PXPConfig', 'GasSponsoredTransaction')
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- PXPConfig Table:
-- ----------------
-- - Public read ensures reward transparency for all users
-- - Only blog owner can modify to prevent unauthorized reward changes
-- - Consider caching PXPConfig values in your app for performance
--
-- GasSponsoredTransaction Table:
-- -------------------------------
-- - Users can see their own gas usage for transparency
-- - Admins can monitor total gas sponsorship costs
-- - Transaction writes are handled by backend gas relay service (service role)
-- - Rate limiting is enforced in application logic, not RLS
-- - Consider periodic cleanup of old transaction records
--
-- JWT Requirements:
-- -----------------
-- These policies assume your Supabase Auth JWT includes:
-- - walletAddress: User's Ethereum wallet address
-- Adjust auth.jwt() ->> 'walletAddress' if your JWT structure differs
--
-- Backend Service Role:
-- ---------------------
-- The backend service (gas relay, PXP distribution) should use the
-- service role key which bypasses RLS for:
-- - Creating gas transaction records
-- - Updating PXP configs programmatically (if needed)
-- - Bulk operations and analytics
--
-- ============================================================================
