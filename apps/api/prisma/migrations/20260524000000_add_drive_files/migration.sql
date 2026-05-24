-- AlterTable: add Google OAuth fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DriveFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "driveFileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "webViewLink" TEXT,
    "webContentLink" TEXT,
    "iconLink" TEXT,
    "size" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriveFile_userId_idx" ON "DriveFile"("userId");

-- CreateIndex
CREATE INDEX "DriveFile_caseId_idx" ON "DriveFile"("caseId");

-- AddForeignKey
ALTER TABLE "DriveFile" ADD CONSTRAINT "DriveFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveFile" ADD CONSTRAINT "DriveFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DecisionCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
