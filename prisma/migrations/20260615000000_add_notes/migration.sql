-- CreateTable: Note model
-- Unified notes system: attaches to groups, events, or user profiles.
-- isPrivate=true means only the author can read/update/delete.

CREATE TABLE IF NOT EXISTS "Note" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "groupId" INTEGER,
    "eventId" INTEGER,
    "profileUserId" INTEGER,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "practiceMinutes" INTEGER,
    "qualityRating" INTEGER,
    "youtubeUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "pxpAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Note_groupId_idx" ON "Note"("groupId");
CREATE INDEX IF NOT EXISTS "Note_eventId_idx" ON "Note"("eventId");
CREATE INDEX IF NOT EXISTS "Note_profileUserId_idx" ON "Note"("profileUserId");
CREATE INDEX IF NOT EXISTS "Note_authorId_idx" ON "Note"("authorId");

-- Foreign keys
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" ADD CONSTRAINT "Note_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" ADD CONSTRAINT "Note_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" ADD CONSTRAINT "Note_profileUserId_fkey"
    FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed PXPConfig entry for practice session reward
INSERT INTO "PXPConfig" ("key", "value", "label", "description", "category", "enabled", "updatedAt")
VALUES (
    'note_practice_session',
    5,
    'Practice Session Note',
    'Awarded when a user logs a note with practice time recorded',
    'note',
    true,
    NOW()
) ON CONFLICT ("key") DO NOTHING;
