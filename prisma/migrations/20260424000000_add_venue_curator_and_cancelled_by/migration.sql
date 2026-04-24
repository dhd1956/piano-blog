-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "cancelledByUserId" INTEGER;

-- CreateTable
CREATE TABLE "VenueCurator" (
    "venueId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER NOT NULL,

    CONSTRAINT "VenueCurator_pkey" PRIMARY KEY ("venueId","userId")
);

-- CreateIndex
CREATE INDEX "VenueCurator_userId_idx" ON "VenueCurator"("userId");

-- AddForeignKey
ALTER TABLE "VenueCurator" ADD CONSTRAINT "VenueCurator_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueCurator" ADD CONSTRAINT "VenueCurator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueCurator" ADD CONSTRAINT "VenueCurator_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
