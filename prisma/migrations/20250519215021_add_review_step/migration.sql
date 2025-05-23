/*
  Warnings:

  - A unique constraint covering the columns `[word,userId]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "reviewStep" INTEGER NOT NULL DEFAULT -1;

-- CreateIndex
CREATE UNIQUE INDEX "Card_word_userId_key" ON "Card"("word", "userId");
