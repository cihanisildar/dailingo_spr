-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastTestDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "isSuccess" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
