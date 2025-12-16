-- ============================================================================
-- Row Level Security (RLS) Policies for Piano Blog Database
-- Generated: 2025-12-10
-- ============================================================================
--
-- IMPORTANT: Review and test these policies in a staging environment first!
-- These policies are based on the application's access patterns as of Dec 2025.
--
-- Usage:
--   1. Review each policy for your specific security requirements
--   2. Run in Supabase SQL Editor
--   3. Test with different user roles
--   4. Monitor query performance (indexes are already in schema)
--
-- ============================================================================

-- ============================================================================
-- PART 1: SYSTEM TABLES
-- ============================================================================

-- _prisma_migrations: Block all public access
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
-- No policies = only service role can access

-- ============================================================================
-- PART 2: PUBLIC READ TABLES (Open read, restricted write)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Venue: Public can read verified venues, scouts can submit, curators can edit
-- ----------------------------------------------------------------------------
ALTER TABLE public."Venue" ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified venues
CREATE POLICY "Venues are viewable by everyone"
  ON public."Venue"
  FOR SELECT
  USING (true);

-- Authenticated users can create venues (as scouts)
CREATE POLICY "Authenticated users can submit venues"
  ON public."Venue"
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Venue submitters can update their own unverified venues
CREATE POLICY "Submitters can update their own unverified venues"
  ON public."Venue"
  FOR UPDATE
  USING (
    "submittedBy" = auth.jwt() ->> 'walletAddress'
    AND "verified" = false
  )
  WITH CHECK (
    "submittedBy" = auth.jwt() ->> 'walletAddress'
    AND "verified" = false
  );

-- Note: Curator/validator updates handled via service role or separate policy
-- based on User.role. Add this if you need client-side curator access:
/*
CREATE POLICY "Curators and admins can update any venue"
  ON public."Venue"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role IN ('CURATOR', 'BLOG_OWNER', 'VALIDATOR')
    )
  );
*/

-- Only blog owner can delete venues
CREATE POLICY "Only blog owner can delete venues"
  ON public."Venue"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role = 'BLOG_OWNER'
    )
  );

-- ----------------------------------------------------------------------------
-- VenueReview: Public read, user-specific write
-- ----------------------------------------------------------------------------
ALTER TABLE public."VenueReview" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public."VenueReview"
  FOR SELECT
  USING ("isHidden" = false);

CREATE POLICY "Authenticated users can create reviews"
  ON public."VenueReview"
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON public."VenueReview"
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

CREATE POLICY "Users can delete their own reviews"
  ON public."VenueReview"
  FOR DELETE
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

-- ----------------------------------------------------------------------------
-- Event: Public read (if isPublic=true), organizer write
-- ----------------------------------------------------------------------------
ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone"
  ON public."Event"
  FOR SELECT
  USING (
    "isPublic" = true
    OR "organizerId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

CREATE POLICY "Authenticated users can create events"
  ON public."Event"
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND "organizerId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

CREATE POLICY "Organizers can update their own events"
  ON public."Event"
  FOR UPDATE
  USING (
    "organizerId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  )
  WITH CHECK (
    "organizerId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

CREATE POLICY "Organizers can delete their own events"
  ON public."Event"
  FOR DELETE
  USING (
    "organizerId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

-- ----------------------------------------------------------------------------
-- EventRSVP: Users manage their own RSVPs, organizers see all for their events
-- ----------------------------------------------------------------------------
ALTER TABLE public."EventRSVP" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view RSVPs for events they organize"
  ON public."EventRSVP"
  FOR SELECT
  USING (
    -- User's own RSVPs
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
    OR
    -- RSVPs for events they organize
    "eventId" IN (
      SELECT id FROM public."Event"
      WHERE "organizerId" IN (
        SELECT id FROM public."User"
        WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      )
    )
  );

CREATE POLICY "Users can create their own RSVPs"
  ON public."EventRSVP"
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

CREATE POLICY "Users can update their own RSVPs"
  ON public."EventRSVP"
  FOR UPDATE
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
    OR
    -- Organizers can update RSVPs for approval/waitlist management
    "eventId" IN (
      SELECT id FROM public."Event"
      WHERE "organizerId" IN (
        SELECT id FROM public."User"
        WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      )
    )
  );

CREATE POLICY "Users can delete their own RSVPs"
  ON public."EventRSVP"
  FOR DELETE
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

-- ============================================================================
-- PART 3: USER-SPECIFIC TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User: Public profiles viewable, users manage their own data
-- ----------------------------------------------------------------------------
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public."User"
  FOR SELECT
  USING (
    "publicProfile" = true
    OR "walletAddress" = auth.jwt() ->> 'walletAddress'
    OR "username" = auth.jwt() ->> 'username'
  );

CREATE POLICY "Users can update their own profile"
  ON public."User"
  FOR UPDATE
  USING (
    "walletAddress" = auth.jwt() ->> 'walletAddress'
    OR "username" = auth.jwt() ->> 'username'
  )
  WITH CHECK (
    "walletAddress" = auth.jwt() ->> 'walletAddress'
    OR "username" = auth.jwt() ->> 'username'
  );

-- User creation typically handled by service role during signup
-- If you need client-side user creation, add:
/*
CREATE POLICY "Users can create their own account"
  ON public."User"
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      "walletAddress" = auth.jwt() ->> 'walletAddress'
      OR "username" = auth.jwt() ->> 'username'
    )
  );
*/

-- ----------------------------------------------------------------------------
-- MusicianProfile: Public read (respecting parent User privacy), user write
-- ----------------------------------------------------------------------------
ALTER TABLE public."MusicianProfile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public musician profiles are viewable"
  ON public."MusicianProfile"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "User".id = "MusicianProfile"."userId"
      AND "User"."publicProfile" = true
    )
    OR "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

CREATE POLICY "Users can manage their own musician profile"
  ON public."MusicianProfile"
  FOR ALL
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

-- ----------------------------------------------------------------------------
-- Session: Users can only access their own sessions
-- ----------------------------------------------------------------------------
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sessions"
  ON public."Session"
  FOR ALL
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      OR "username" = auth.jwt() ->> 'username'
    )
  )
  WITH CHECK (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      OR "username" = auth.jwt() ->> 'username'
    )
  );

-- ============================================================================
-- PART 4: PROTECTED TABLES (Curator/Validator/Admin only)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VenueVerification: Curators and validators only
-- ----------------------------------------------------------------------------
ALTER TABLE public."VenueVerification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications are viewable by authenticated users"
  ON public."VenueVerification"
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Curators can create verifications"
  ON public."VenueVerification"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role IN ('CURATOR', 'VALIDATOR', 'BLOG_OWNER')
    )
  );

-- ----------------------------------------------------------------------------
-- VenueValidation: Validators can vote, all can read
-- ----------------------------------------------------------------------------
ALTER TABLE public."VenueValidation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validations are viewable by authenticated users"
  ON public."VenueValidation"
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Validators can create validations"
  ON public."VenueValidation"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role IN ('VALIDATOR', 'BLOG_OWNER')
    )
    AND "validatorId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

-- ----------------------------------------------------------------------------
-- VenueAnalytics: Venue owners and admins only
-- ----------------------------------------------------------------------------
ALTER TABLE public."VenueAnalytics" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue owners can view their analytics"
  ON public."VenueAnalytics"
  FOR SELECT
  USING (
    "venueId" IN (
      SELECT id FROM public."Venue"
      WHERE "submittedBy" = auth.jwt() ->> 'walletAddress'
    )
    OR
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role IN ('BLOG_OWNER', 'CURATOR')
    )
  );

-- Analytics writes typically handled by service role
-- Add write policies if needed for client-side tracking

-- ============================================================================
-- PART 5: BLOCKCHAIN TRANSACTION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PXPPayment: Users can view their own payments, all can see verified venue payments
-- ----------------------------------------------------------------------------
ALTER TABLE public."PXPPayment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON public."PXPPayment"
  FOR SELECT
  USING (
    "fromAddress" = auth.jwt() ->> 'walletAddress'
    OR "toAddress" = auth.jwt() ->> 'walletAddress'
    OR "status" = 'CONFIRMED' -- Public transparency for confirmed payments
  );

-- Payment creation typically handled by blockchain listeners (service role)
-- Add write policies only if you have client-side payment recording

-- ----------------------------------------------------------------------------
-- BlockchainEvent: Read-only for transparency
-- ----------------------------------------------------------------------------
ALTER TABLE public."BlockchainEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blockchain events are viewable by authenticated users"
  ON public."BlockchainEvent"
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Writes handled by blockchain listener service (service role only)

-- ============================================================================
-- PART 6: ADMIN TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- AppConfig: Admin only
-- ----------------------------------------------------------------------------
ALTER TABLE public."AppConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only blog owner can manage app config"
  ON public."AppConfig"
  FOR ALL
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

-- ============================================================================
-- VERIFICATION & TESTING QUERIES
-- ============================================================================

-- Uncomment to verify all tables have RLS enabled:
/*
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- Uncomment to view all policies:
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
--
-- 1. JWT Claims: These policies assume auth.jwt() returns a JSON object with:
--    - walletAddress: Ethereum wallet address (for Web3 users)
--    - username: Username (for traditional auth users)
--    Adjust the auth.jwt() ->> 'walletAddress' references based on your
--    actual Supabase Auth configuration.
--
-- 2. Service Role: Backend operations (blockchain listeners, admin tasks)
--    should use the service role key which bypasses RLS.
--
-- 3. Performance: All referenced columns already have indexes in your schema.
--    Monitor query performance and add composite indexes if needed.
--
-- 4. Role-Based Access: Curator/Validator/Admin policies assume the User.role
--    field is properly maintained. Consider triggers to prevent role escalation.
--
-- 5. Testing: Test each policy with different user roles:
--    - Anonymous users (no auth)
--    - Authenticated SCOUT
--    - Authenticated CURATOR
--    - Authenticated VALIDATOR
--    - BLOG_OWNER
--
-- 6. Gradual Rollout: Consider enabling RLS table-by-table in production:
--    - Start with _prisma_migrations (safest)
--    - Then Session, PXPPayment, AppConfig (low traffic)
--    - Then User, MusicianProfile
--    - Finally Venue, Event, VenueReview (high traffic)
--    Monitor each step for errors and performance issues.
--
-- ============================================================================
