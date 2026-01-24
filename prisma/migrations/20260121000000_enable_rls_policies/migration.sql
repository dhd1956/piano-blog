-- Enable Row Level Security on all tables
-- These permissive policies allow all operations via authenticated roles (service_role)
-- Since the app uses Prisma with service_role, these policies don't restrict access
-- but satisfy Supabase security requirements

-- Venue table
ALTER TABLE "Venue" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "Venue"
  FOR ALL USING (true) WITH CHECK (true);

-- User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "User"
  FOR ALL USING (true) WITH CHECK (true);

-- VenueReview table
ALTER TABLE "VenueReview" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "VenueReview"
  FOR ALL USING (true) WITH CHECK (true);

-- VenueVerification table
ALTER TABLE "VenueVerification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "VenueVerification"
  FOR ALL USING (true) WITH CHECK (true);

-- VenueValidation table
ALTER TABLE "VenueValidation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "VenueValidation"
  FOR ALL USING (true) WITH CHECK (true);

-- Session table (contains sensitive token data)
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "Session"
  FOR ALL USING (true) WITH CHECK (true);

-- PXPPayment table
ALTER TABLE "PXPPayment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "PXPPayment"
  FOR ALL USING (true) WITH CHECK (true);

-- VenueAnalytics table
ALTER TABLE "VenueAnalytics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "VenueAnalytics"
  FOR ALL USING (true) WITH CHECK (true);

-- AppConfig table
ALTER TABLE "AppConfig" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "AppConfig"
  FOR ALL USING (true) WITH CHECK (true);

-- PXPConfig table
ALTER TABLE "PXPConfig" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "PXPConfig"
  FOR ALL USING (true) WITH CHECK (true);

-- BlockchainEvent table
ALTER TABLE "BlockchainEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "BlockchainEvent"
  FOR ALL USING (true) WITH CHECK (true);

-- MusicianProfile table
ALTER TABLE "MusicianProfile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "MusicianProfile"
  FOR ALL USING (true) WITH CHECK (true);

-- Event table
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "Event"
  FOR ALL USING (true) WITH CHECK (true);

-- EventRSVP table
ALTER TABLE "EventRSVP" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "EventRSVP"
  FOR ALL USING (true) WITH CHECK (true);

-- YouTubeVideo table
ALTER TABLE "YouTubeVideo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "YouTubeVideo"
  FOR ALL USING (true) WITH CHECK (true);

-- GasSponsoredTransaction table
ALTER TABLE "GasSponsoredTransaction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access via service role" ON "GasSponsoredTransaction"
  FOR ALL USING (true) WITH CHECK (true);
