-- ============================================================================
-- RLS Validation Script
-- ============================================================================
--
-- Run this script in Supabase SQL Editor to validate your RLS implementation
-- Each query returns results that indicate security status
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: RLS STATUS CHECK
-- ============================================================================

-- Check which tables have RLS enabled
-- Expected: All public tables except system tables should have rowsecurity=true
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY
  rowsecurity ASC, -- Show disabled tables first
  tablename;

-- ============================================================================
-- SECTION 2: POLICY COVERAGE
-- ============================================================================

-- Count policies per table
-- Expected: Each table should have at least 1 policy (except _prisma_migrations)
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  COALESCE(COUNT(p.policyname), 0) as policy_count,
  CASE
    WHEN t.rowsecurity = false THEN '⚠️  RLS NOT ENABLED'
    WHEN COALESCE(COUNT(p.policyname), 0) = 0 THEN '⚠️  NO POLICIES (Blocked to all)'
    WHEN COALESCE(COUNT(p.policyname), 0) >= 1 THEN '✅ Protected'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
GROUP BY t.tablename, t.rowsecurity
ORDER BY
  CASE
    WHEN t.rowsecurity = false THEN 0
    WHEN COALESCE(COUNT(p.policyname), 0) = 0 THEN 1
    ELSE 2
  END,
  t.tablename;

-- ============================================================================
-- SECTION 3: DETAILED POLICY INSPECTION
-- ============================================================================

-- List all policies with their permissions
-- Review this to ensure policies match your security requirements
SELECT
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
    ELSE cmd
  END as operation,
  CASE
    WHEN roles = '{public}' THEN 'Anonymous + Authenticated'
    WHEN roles = '{authenticated}' THEN 'Authenticated Only'
    WHEN roles = '{anon}' THEN 'Anonymous Only'
    ELSE roles::text
  END as allowed_roles,
  CASE permissive
    WHEN 'PERMISSIVE' THEN '✅ Permissive'
    WHEN 'RESTRICTIVE' THEN '⚠️  Restrictive'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 4: CRITICAL TABLE CHECKS
-- ============================================================================

-- Check critical tables are protected
-- Expected: All should show 'Protected'
SELECT
  'Critical Tables Security Status' as check_name,
  tablename,
  CASE
    WHEN rowsecurity AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE pg_policies.tablename = pg_tables.tablename
      AND schemaname = 'public'
    ) THEN '✅ Protected'
    WHEN rowsecurity THEN '⚠️  RLS enabled but no policies'
    ELSE '❌ VULNERABLE - RLS not enabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    '_prisma_migrations',
    'User',
    'Session',
    'AppConfig',
    'Venue',
    'Event',
    'VenueReview'
  )
ORDER BY
  CASE
    WHEN NOT rowsecurity THEN 0
    WHEN rowsecurity AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE pg_policies.tablename = pg_tables.tablename
      AND schemaname = 'public'
    ) THEN 1
    ELSE 2
  END,
  tablename;

-- ============================================================================
-- SECTION 5: ANONYMOUS ACCESS SIMULATION
-- ============================================================================

-- Test what anonymous users can access
-- Expected: Should only access public-readable tables
SET ROLE anon;

DO $$
DECLARE
  table_name text;
  row_count int;
  result_text text := E'\n=== Anonymous User Access Test ===\n\n';
BEGIN
  -- Test each main table
  FOR table_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('User', 'Venue', 'Event', 'Session', 'AppConfig')
    ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM public."%I"', table_name) INTO row_count;
      result_text := result_text || format('%s: %s rows visible\n',
        table_name,
        COALESCE(row_count::text, '0')
      );
    EXCEPTION WHEN OTHERS THEN
      result_text := result_text || format('%s: ❌ Access denied (Good!)\n', table_name);
    END;
  END LOOP;

  RAISE NOTICE '%', result_text;
END $$;

RESET ROLE;

-- ============================================================================
-- SECTION 6: PERFORMANCE CHECK
-- ============================================================================

-- Check for missing indexes on RLS-filtered columns
-- Your schema already has good indexes, but this verifies them
SELECT
  'Index Coverage for RLS Policies' as check_name,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexdef ILIKE '%walletAddress%'
    OR indexdef ILIKE '%userId%'
    OR indexdef ILIKE '%organizerId%'
    OR indexdef ILIKE '%submittedBy%'
    OR indexdef ILIKE '%role%'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 7: SECURITY SUMMARY
-- ============================================================================

-- Overall security score
WITH security_stats AS (
  SELECT
    COUNT(*) as total_tables,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as rls_enabled_count,
    SUM(CASE
      WHEN rowsecurity AND EXISTS (
        SELECT 1 FROM pg_policies
        WHERE pg_policies.tablename = pg_tables.tablename
        AND pg_policies.schemaname = 'public'
      ) THEN 1
      ELSE 0
    END) as tables_with_policies
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
)
SELECT
  '=== SECURITY SUMMARY ===' as report,
  total_tables as total_tables,
  rls_enabled_count as tables_with_rls,
  tables_with_policies as tables_fully_protected,
  ROUND(100.0 * rls_enabled_count / total_tables, 1) || '%' as rls_coverage,
  ROUND(100.0 * tables_with_policies / total_tables, 1) || '%' as policy_coverage,
  CASE
    WHEN tables_with_policies = total_tables THEN '✅ FULLY SECURED'
    WHEN tables_with_policies >= total_tables * 0.8 THEN '⚠️  MOSTLY SECURED (review remaining tables)'
    WHEN rls_enabled_count >= total_tables * 0.5 THEN '⚠️  PARTIALLY SECURED (add more policies)'
    ELSE '❌ VULNERABLE (enable RLS and add policies)'
  END as security_status
FROM security_stats;

-- ============================================================================
-- VALIDATION COMPLETE
-- ============================================================================
--
-- Review the results above:
--
-- 1. Section 1: All your application tables should show "✅ ENABLED"
-- 2. Section 2: All tables should have at least 1 policy
-- 3. Section 3: Review policies match your security requirements
-- 4. Section 4: All critical tables should show "✅ Protected"
-- 5. Section 5: Anonymous user should have limited access
-- 6. Section 6: Verify indexes exist for RLS-filtered columns
-- 7. Section 7: Security summary should show 100% coverage
--
-- If any checks fail, review the RLS_IMPLEMENTATION_GUIDE.md for fixes.
--
-- ============================================================================
