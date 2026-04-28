-- CreateEnum
CREATE TYPE "CollaborationStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL', 'ALL_LEVELS');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('DANCER', 'INSTRUCTOR', 'CHOREOGRAPHER');

-- CreateEnum
CREATE TYPE "CvEntryType" AS ENUM ('TRAINING', 'PROJECT', 'WORKSHOP', 'COMPETITION');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "danceStyles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "payoutDetails" TEXT,
ADD COLUMN     "portfolioLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyClass" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studioId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "level" "ClassLevel" NOT NULL,
    "teacherName" TEXT,
    "teacherId" INTEGER,
    "capacity" INTEGER,

    CONSTRAINT "WeeklyClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipTier" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studioId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "classLimit" INTEGER,
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MembershipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMembership" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dancerId" INTEGER NOT NULL,
    "tierId" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "creditsTotal" INTEGER,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTeamMember" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studioId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "TeamRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "studioId" INTEGER NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "description" TEXT,
    "status" "CollaborationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("studioId","agencyId")
);

-- CreateTable
CREATE TABLE "CvEntry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "CvEntryType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "choreographer" TEXT,
    "taggedStudioId" INTEGER,
    "taggedAgencyId" INTEGER,

    CONSTRAINT "CvEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyRoster" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "dancerId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaggedEvents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TaggedEvents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "WeeklyClass_studioId_idx" ON "WeeklyClass"("studioId");

-- CreateIndex
CREATE INDEX "WeeklyClass_teacherId_idx" ON "WeeklyClass"("teacherId");

-- CreateIndex
CREATE INDEX "MembershipTier_studioId_idx" ON "MembershipTier"("studioId");

-- CreateIndex
CREATE INDEX "UserMembership_dancerId_idx" ON "UserMembership"("dancerId");

-- CreateIndex
CREATE INDEX "UserMembership_tierId_idx" ON "UserMembership"("tierId");

-- CreateIndex
CREATE INDEX "StudioTeamMember_studioId_idx" ON "StudioTeamMember"("studioId");

-- CreateIndex
CREATE INDEX "StudioTeamMember_userId_idx" ON "StudioTeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTeamMember_studioId_userId_role_key" ON "StudioTeamMember"("studioId", "userId", "role");

-- CreateIndex
CREATE INDEX "Collaboration_studioId_idx" ON "Collaboration"("studioId");

-- CreateIndex
CREATE INDEX "Collaboration_agencyId_idx" ON "Collaboration"("agencyId");

-- CreateIndex
CREATE INDEX "CvEntry_userId_idx" ON "CvEntry"("userId");

-- CreateIndex
CREATE INDEX "CvEntry_taggedStudioId_idx" ON "CvEntry"("taggedStudioId");

-- CreateIndex
CREATE INDEX "CvEntry_taggedAgencyId_idx" ON "CvEntry"("taggedAgencyId");

-- CreateIndex
CREATE INDEX "AgencyRoster_agencyId_idx" ON "AgencyRoster"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyRoster_dancerId_idx" ON "AgencyRoster"("dancerId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyRoster_agencyId_dancerId_key" ON "AgencyRoster"("agencyId", "dancerId");

-- CreateIndex
CREATE INDEX "_TaggedEvents_B_index" ON "_TaggedEvents"("B");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyClass" ADD CONSTRAINT "WeeklyClass_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyClass" ADD CONSTRAINT "WeeklyClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipTier" ADD CONSTRAINT "MembershipTier_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMembership" ADD CONSTRAINT "UserMembership_dancerId_fkey" FOREIGN KEY ("dancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMembership" ADD CONSTRAINT "UserMembership_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "MembershipTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTeamMember" ADD CONSTRAINT "StudioTeamMember_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTeamMember" ADD CONSTRAINT "StudioTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvEntry" ADD CONSTRAINT "CvEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvEntry" ADD CONSTRAINT "CvEntry_taggedStudioId_fkey" FOREIGN KEY ("taggedStudioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvEntry" ADD CONSTRAINT "CvEntry_taggedAgencyId_fkey" FOREIGN KEY ("taggedAgencyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRoster" ADD CONSTRAINT "AgencyRoster_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRoster" ADD CONSTRAINT "AgencyRoster_dancerId_fkey" FOREIGN KEY ("dancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaggedEvents" ADD CONSTRAINT "_TaggedEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaggedEvents" ADD CONSTRAINT "_TaggedEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
