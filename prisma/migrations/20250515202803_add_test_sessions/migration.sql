-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
