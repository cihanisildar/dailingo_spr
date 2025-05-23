/*
  Warnings:

  - You are about to drop the column `interval` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `intervalDuration` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `nextReview` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `reviewEndDate` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStartDate` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStatus` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStep` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `currentStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastReviewDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `longestStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `streakUpdatedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "interval",
DROP COLUMN "intervalDuration",
DROP COLUMN "nextReview",
DROP COLUMN "reviewEndDate",
DROP COLUMN "reviewStartDate",
DROP COLUMN "reviewStatus",
DROP COLUMN "reviewStep",
ALTER COLUMN "lastReviewed" DROP NOT NULL,
ALTER COLUMN "lastReviewed" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentStreak",
DROP COLUMN "lastReviewDate",
DROP COLUMN "longestStreak",
DROP COLUMN "password",
DROP COLUMN "streakUpdatedAt";

-- CreateTable
CREATE TABLE "CardProgress" (
    "id" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "originalCardId" TEXT NOT NULL,

    CONSTRAINT "CardProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardProgress_userId_originalCardId_key" ON "CardProgress"("userId", "originalCardId");

-- AddForeignKey
ALTER TABLE "CardProgress" ADD CONSTRAINT "CardProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardProgress" ADD CONSTRAINT "CardProgress_originalCardId_fkey" FOREIGN KEY ("originalCardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
