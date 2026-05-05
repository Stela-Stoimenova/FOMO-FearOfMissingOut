-- Make User.password nullable (for OAuth users)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Add googleId for Google OAuth
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");

-- Add danceStyles to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "danceStyles" TEXT[] DEFAULT '{}';

-- Add Stripe payment intent tracking to Ticket
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
