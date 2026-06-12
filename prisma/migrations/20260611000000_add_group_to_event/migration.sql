-- Add optional groupId to Event (group-organised events)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "groupId" INTEGER;

CREATE INDEX IF NOT EXISTS "Event_groupId_idx" ON "Event"("groupId");

DO $$ BEGIN
  ALTER TABLE "Event" ADD CONSTRAINT "Event_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
