-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');

-- DropForeignKey
ALTER TABLE "Card" DROP CONSTRAINT "Card_wordListId_fkey";

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "failureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "intervalDuration" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "reviewEndDate" TIMESTAMP(3),
ADD COLUMN     "reviewStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "reviewStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "successCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "wordListId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WordList" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intervals" INTEGER[],
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Schedule',
    "description" TEXT,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordDetails" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "synonyms" TEXT[],
    "antonyms" TEXT[],
    "examples" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_userId_key" ON "ReviewSchedule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WordDetails_cardId_key" ON "WordDetails"("cardId");

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordDetails" ADD CONSTRAINT "WordDetails_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
