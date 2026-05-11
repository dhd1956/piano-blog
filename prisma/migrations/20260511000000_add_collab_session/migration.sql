-- CreateTable: CollabSession
CREATE TABLE "CollabSession" (
    "id"               SERIAL NOT NULL,
    "creatorId"        INTEGER NOT NULL,
    "recipientId"      INTEGER NOT NULL,
    "savedByCreator"   BOOLEAN NOT NULL DEFAULT false,
    "savedByRecipient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CollabSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CollabMessage
CREATE TABLE "CollabMessage" (
    "id"        SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "senderId"  INTEGER NOT NULL,
    "body"      VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollabMessage_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one session per ordered pair
CREATE UNIQUE INDEX "CollabSession_creatorId_recipientId_key" ON "CollabSession"("creatorId", "recipientId");

-- Indexes
CREATE INDEX "CollabSession_creatorId_idx"           ON "CollabSession"("creatorId");
CREATE INDEX "CollabSession_recipientId_idx"         ON "CollabSession"("recipientId");
CREATE INDEX "CollabMessage_sessionId_createdAt_idx" ON "CollabMessage"("sessionId", "createdAt");
CREATE INDEX "CollabMessage_senderId_idx"            ON "CollabMessage"("senderId");

-- Foreign keys: CollabSession
ALTER TABLE "CollabSession" ADD CONSTRAINT "CollabSession_creatorId_fkey"
    FOREIGN KEY ("creatorId")   REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollabSession" ADD CONSTRAINT "CollabSession_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys: CollabMessage
ALTER TABLE "CollabMessage" ADD CONSTRAINT "CollabMessage_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "CollabSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollabMessage" ADD CONSTRAINT "CollabMessage_senderId_fkey"
    FOREIGN KEY ("senderId")  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (consistent with project convention — no policies = deny all via PostgREST)
ALTER TABLE "CollabSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CollabMessage" ENABLE ROW LEVEL SECURITY;
