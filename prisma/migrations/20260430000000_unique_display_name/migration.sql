-- Add unique constraint on displayName (NULLs are exempt in PostgreSQL)
DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_displayName_key" UNIQUE ("displayName");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;
