-- Add columns that were added via prisma db push but never tracked in migrations.
-- Every statement uses IF NOT EXISTS so it's safe to run idempotently.

-- Authentication fields
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'SCOUT';
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Profile fields
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "profileSlug" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "badges" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Email verification
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);

-- Password reset
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "passwordResetExpiry" TIMESTAMP(3);

-- Profile completion tracking
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "profileCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "profileCompletedAt" TIMESTAMP(3);

-- Onboarding tracking
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "userInterests" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "lastOnboardingNudge" TIMESTAMP(3);

-- Migration tracking (wallet-only users)
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailAddedAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailReminderDismissedAt" TIMESTAMP(3);

-- Wallet linking tracking
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "walletLinkingPromptDismissedAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "walletLinkingPromptShownCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "firstPXPEarnedAt" TIMESTAMP(3);

-- Embedded wallet tracking
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "walletType" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "authProvider" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "embeddedWalletCreatedAt" TIMESTAMP(3);

-- YouTube OAuth integration
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "youtubeChannelId" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "youtubeChannelName" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "youtubeAccessToken" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "youtubeRefreshToken" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "youtubeTokenExpiry" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "youtubeVerifiedAt" TIMESTAMP(3);

-- Referral system
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "referralPXPEarned" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "referralCount" INTEGER NOT NULL DEFAULT 0;

-- Privacy settings
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "publicProfile" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "showPXPBalance" BOOLEAN NOT NULL DEFAULT false;

-- QR Code settings
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "qrCardStyle" JSONB;

-- Make walletAddress nullable (was NOT NULL in initial migration)
ALTER TABLE "public"."User" ALTER COLUMN "walletAddress" DROP NOT NULL;

-- Add unique constraints (silently skip if they already exist)
DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_profileSlug_key" UNIQUE ("profileSlug");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_emailVerificationToken_key" UNIQUE ("emailVerificationToken");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_passwordResetToken_key" UNIQUE ("passwordResetToken");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_youtubeChannelId_key" UNIQUE ("youtubeChannelId");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_referralCode_key" UNIQUE ("referralCode");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "User_profileSlug_idx" ON "public"."User"("profileSlug");
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "public"."User"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "User_emailVerified_idx" ON "public"."User"("emailVerified");
CREATE INDEX IF NOT EXISTS "User_passwordResetToken_idx" ON "public"."User"("passwordResetToken");
CREATE INDEX IF NOT EXISTS "User_referralCode_idx" ON "public"."User"("referralCode");
CREATE INDEX IF NOT EXISTS "User_referredBy_idx" ON "public"."User"("referredBy");

-- Add foreign key for referral system
DO $$
BEGIN
  ALTER TABLE "public"."User" ADD CONSTRAINT "User_referredBy_fkey"
    FOREIGN KEY ("referredBy") REFERENCES "public"."User"("referralCode")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
