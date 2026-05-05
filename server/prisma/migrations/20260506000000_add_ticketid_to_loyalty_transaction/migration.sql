-- AlterTable: add ticketId to LoyaltyTransaction for precise cancellation reversal
ALTER TABLE "LoyaltyTransaction" ADD COLUMN "ticketId" INTEGER;

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_userId_idx" ON "LoyaltyTransaction"("userId");
CREATE INDEX "LoyaltyTransaction_ticketId_idx" ON "LoyaltyTransaction"("ticketId");
