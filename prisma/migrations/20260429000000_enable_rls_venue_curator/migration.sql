-- Enable Row Level Security on VenueCurator table
-- Applied manually via Supabase SQL editor; this file completes the migration record.

ALTER TABLE "VenueCurator" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Allow all access via service role" ON "VenueCurator"
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
