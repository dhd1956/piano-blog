-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."VenueType" AS ENUM ('CAFE', 'RESTAURANT', 'BAR', 'CLUB', 'COMMUNITY_CENTER', 'HOTEL', 'LIBRARY', 'SCHOOL', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Venue" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "contactType" TEXT NOT NULL DEFAULT 'email',
    "submittedBy" TEXT NOT NULL,
    "hasPiano" BOOLEAN NOT NULL DEFAULT false,
    "hasJamSession" BOOLEAN NOT NULL DEFAULT false,
    "venueType" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "amenities" TEXT[],
    "tags" TEXT[],
    "priceRange" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "venueHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "walletAddress" VARCHAR(42) NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "email" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "location" TEXT,
    "ensName" TEXT,
    "profileNFT" TEXT,
    "totalCAVEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasClaimedNewUserReward" BOOLEAN NOT NULL DEFAULT false,
    "isAuthorizedVerifier" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VenueReview" (
    "id" SERIAL NOT NULL,
    "venueId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "pianoQuality" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VenueVerification" (
    "id" SERIAL NOT NULL,
    "venueId" INTEGER NOT NULL,
    "verifierAddress" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "notes" TEXT,
    "rating" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionHash" TEXT,
    "blockNumber" INTEGER,

    CONSTRAINT "VenueVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CAVPayment" (
    "id" SERIAL NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "venueId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paymentType" TEXT NOT NULL,
    "memo" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CAVPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VenueAnalytics" (
    "id" SERIAL NOT NULL,
    "venueId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "qrScans" INTEGER NOT NULL DEFAULT 0,
    "detailViews" INTEGER NOT NULL DEFAULT 0,
    "shareClicks" INTEGER NOT NULL DEFAULT 0,
    "searchImpressions" INTEGER NOT NULL DEFAULT 0,
    "searchClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VenueAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockchainEvent" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "eventData" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockchainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "public"."Venue"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_venueHash_key" ON "public"."Venue"("venueHash");

-- CreateIndex
CREATE INDEX "Venue_city_verified_idx" ON "public"."Venue"("city", "verified");

-- CreateIndex
CREATE INDEX "Venue_hasPiano_verified_idx" ON "public"."Venue"("hasPiano", "verified");

-- CreateIndex
CREATE INDEX "Venue_latitude_longitude_idx" ON "public"."Venue"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Venue_submittedBy_idx" ON "public"."Venue"("submittedBy");

-- CreateIndex
CREATE INDEX "Venue_venueHash_idx" ON "public"."Venue"("venueHash");

-- CreateIndex
CREATE INDEX "Venue_name_city_idx" ON "public"."Venue"("name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "public"."User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_totalCAVEarned_idx" ON "public"."User"("totalCAVEarned");

-- CreateIndex
CREATE INDEX "VenueReview_venueId_rating_idx" ON "public"."VenueReview"("venueId", "rating");

-- CreateIndex
CREATE INDEX "VenueReview_userId_idx" ON "public"."VenueReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueReview_venueId_userId_key" ON "public"."VenueReview"("venueId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueVerification_transactionHash_key" ON "public"."VenueVerification"("transactionHash");

-- CreateIndex
CREATE INDEX "VenueVerification_venueId_approved_idx" ON "public"."VenueVerification"("venueId", "approved");

-- CreateIndex
CREATE INDEX "VenueVerification_verifierAddress_idx" ON "public"."VenueVerification"("verifierAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CAVPayment_transactionHash_key" ON "public"."CAVPayment"("transactionHash");

-- CreateIndex
CREATE INDEX "CAVPayment_venueId_status_idx" ON "public"."CAVPayment"("venueId", "status");

-- CreateIndex
CREATE INDEX "CAVPayment_fromAddress_idx" ON "public"."CAVPayment"("fromAddress");

-- CreateIndex
CREATE INDEX "CAVPayment_toAddress_idx" ON "public"."CAVPayment"("toAddress");

-- CreateIndex
CREATE INDEX "CAVPayment_transactionHash_idx" ON "public"."CAVPayment"("transactionHash");

-- CreateIndex
CREATE INDEX "CAVPayment_blockTimestamp_idx" ON "public"."CAVPayment"("blockTimestamp");

-- CreateIndex
CREATE INDEX "VenueAnalytics_date_idx" ON "public"."VenueAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "VenueAnalytics_venueId_date_key" ON "public"."VenueAnalytics"("venueId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_key_key" ON "public"."AppConfig"("key");

-- CreateIndex
CREATE INDEX "AppConfig_key_idx" ON "public"."AppConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainEvent_transactionHash_key" ON "public"."BlockchainEvent"("transactionHash");

-- CreateIndex
CREATE INDEX "BlockchainEvent_eventType_processed_idx" ON "public"."BlockchainEvent"("eventType", "processed");

-- CreateIndex
CREATE INDEX "BlockchainEvent_blockNumber_idx" ON "public"."BlockchainEvent"("blockNumber");

-- CreateIndex
CREATE INDEX "BlockchainEvent_contractAddress_idx" ON "public"."BlockchainEvent"("contractAddress");

-- AddForeignKey
ALTER TABLE "public"."VenueReview" ADD CONSTRAINT "VenueReview_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueReview" ADD CONSTRAINT "VenueReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueVerification" ADD CONSTRAINT "VenueVerification_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueAnalytics" ADD CONSTRAINT "VenueAnalytics_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
