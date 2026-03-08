-- Change default for showPXPBalance from false to true
ALTER TABLE "User" ALTER COLUMN "showPXPBalance" SET DEFAULT true;

-- Flip all existing users who have the old default (false)
UPDATE "User" SET "showPXPBalance" = true WHERE "showPXPBalance" = false;
