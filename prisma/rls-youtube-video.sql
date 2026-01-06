-- ============================================================================
-- Row Level Security (RLS) Policies for YouTubeVideo Table
-- Generated: 2025-01-05
-- ============================================================================
--
-- Run this in Supabase SQL Editor to enable RLS on YouTubeVideo table
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- YouTubeVideo: Public read for approved videos, user-specific write
-- ----------------------------------------------------------------------------
ALTER TABLE public."YouTubeVideo" ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved and verified videos
CREATE POLICY "Approved YouTube videos are viewable by everyone"
  ON public."YouTubeVideo"
  FOR SELECT
  USING (
    status = 'APPROVED'
    AND verified = true
  );

-- Users can view their own videos (any status)
CREATE POLICY "Users can view their own YouTube videos"
  ON public."YouTubeVideo"
  FOR SELECT
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
  );

-- Event organizers can view videos for their events
CREATE POLICY "Event organizers can view videos for their events"
  ON public."YouTubeVideo"
  FOR SELECT
  USING (
    "eventId" IN (
      SELECT id FROM public."Event"
      WHERE "organizerId" IN (
        SELECT id FROM public."User"
        WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      )
    )
  );

-- Authenticated users can submit YouTube videos for events they attended
CREATE POLICY "Authenticated users can submit YouTube videos"
  ON public."YouTubeVideo"
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
    -- Optional: Verify user attended the event (has RSVP)
    -- Uncomment if you want strict event attendance validation:
    /*
    AND "eventId" IN (
      SELECT "eventId" FROM public."EventRSVP"
      WHERE "userId" IN (
        SELECT id FROM public."User"
        WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      )
      AND status IN ('CONFIRMED', 'ATTENDED')
    )
    */
  );

-- Users can update their own pending videos
CREATE POLICY "Users can update their own pending YouTube videos"
  ON public."YouTubeVideo"
  FOR UPDATE
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
    AND status = 'PENDING'
  )
  WITH CHECK (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
    -- Users can only update certain fields, not change status
    -- Note: Field-level restrictions require application logic
  );

-- Users can delete their own pending videos
CREATE POLICY "Users can delete their own pending YouTube videos"
  ON public."YouTubeVideo"
  FOR DELETE
  USING (
    "userId" IN (
      SELECT id FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
    )
    AND status = 'PENDING'
  );

-- Curators and admins can view all videos (for moderation)
CREATE POLICY "Curators and admins can view all YouTube videos"
  ON public."YouTubeVideo"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role IN ('CURATOR', 'BLOG_OWNER', 'VALIDATOR')
    )
  );

-- Curators and admins can update any video (for moderation)
CREATE POLICY "Curators and admins can moderate YouTube videos"
  ON public."YouTubeVideo"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE "walletAddress" = auth.jwt() ->> 'walletAddress'
      AND role IN ('CURATOR', 'BLOG_OWNER', 'VALIDATOR')
    )
  );

-- Only blog owner can delete any video
CREATE POLICY "Blog owner can delete any YouTube video"
  ON public."YouTubeVideo"
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

-- Run this to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'YouTubeVideo';

-- Run this to view all YouTubeVideo policies:
-- SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'YouTubeVideo';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. Video milestone rewards (PXP) are handled by the backend cron job
--    using the service role, which bypasses RLS
--
-- 2. Initial PXP award on submission is also handled server-side
--
-- 3. Channel verification uses OAuth and is server-side only
--
-- 4. View count updates are handled by the cron job (service role)
--
-- 5. These policies assume your Supabase Auth JWT includes:
--    - walletAddress: User's Ethereum wallet address
--    Adjust auth.jwt() calls if your JWT structure differs
--
-- ============================================================================
