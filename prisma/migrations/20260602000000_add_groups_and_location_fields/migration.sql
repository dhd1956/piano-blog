-- Add province, country, isVirtual to Venue
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "isVirtual" BOOLEAN NOT NULL DEFAULT false;

-- Add province, country to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- CreateTable: Group
CREATE TABLE IF NOT EXISTS "Group" (
    "id"          SERIAL NOT NULL,
    "slug"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "avatar"      TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "ownerId"     INTEGER NOT NULL,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GroupMember
CREATE TABLE IF NOT EXISTS "GroupMember" (
    "groupId" INTEGER NOT NULL,
    "userId"  INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" INTEGER NOT NULL,
    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("groupId", "userId")
);

-- CreateTable: GroupVenue
CREATE TABLE IF NOT EXISTS "GroupVenue" (
    "groupId" INTEGER NOT NULL,
    "venueId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" INTEGER NOT NULL,
    CONSTRAINT "GroupVenue_pkey" PRIMARY KEY ("groupId", "venueId")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Group_slug_key" ON "Group"("slug");
CREATE INDEX IF NOT EXISTS "Group_ownerId_idx" ON "Group"("ownerId");
CREATE INDEX IF NOT EXISTS "Group_isActive_idx" ON "Group"("isActive");
CREATE INDEX IF NOT EXISTS "GroupMember_userId_idx" ON "GroupMember"("userId");
CREATE INDEX IF NOT EXISTS "GroupVenue_venueId_idx" ON "GroupVenue"("venueId");

-- Foreign keys (skip if already exist)
DO $$ BEGIN
  ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_addedBy_fkey"
    FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GroupVenue" ADD CONSTRAINT "GroupVenue_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GroupVenue" ADD CONSTRAINT "GroupVenue_venueId_fkey"
    FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GroupVenue" ADD CONSTRAINT "GroupVenue_addedBy_fkey"
    FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS (consistent with project convention)
ALTER TABLE "Group" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow all access via service role" ON "Group"
      FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "GroupMember" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow all access via service role" ON "GroupMember"
      FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "GroupVenue" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow all access via service role" ON "GroupVenue"
      FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
