-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "DecisionClass" AS ENUM ('STRATEGIC', 'OPERATIONAL', 'TACTICAL');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'DECIDED', 'IMPLEMENTING', 'REVIEWING', 'CLOSED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CostLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ANALYST',
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "organization" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionCase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT,
    "sector" TEXT,
    "classification" "DecisionClass" NOT NULL DEFAULT 'OPERATIONAL',
    "status" "DecisionStatus" NOT NULL DEFAULT 'DRAFT',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F1Problem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "decisionDate" TIMESTAMP(3),
    "deadline" TEXT,
    "decider" TEXT,
    "advisor" TEXT,
    "decisionType" TEXT[],
    "whatDecision" TEXT,
    "context" TEXT,
    "errorImpact" TEXT,
    "constraints" TEXT,
    "effortLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F1Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F2DataCollection" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sources" JSONB,
    "checklist" JSONB,
    "gaps" TEXT,
    "synthesis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F2DataCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F3Alternative" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "pros" TEXT,
    "cons" TEXT,
    "risk" "RiskLevel",
    "cost" "CostLevel",
    "note" INTEGER,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F3Alternative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F4Voting" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "criteria" JSONB,
    "advisorRecommendation" TEXT,
    "chosenAlternativeId" TEXT,
    "divergedFromRec" BOOLEAN,
    "deciderJustification" TEXT,
    "deciderSignature" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F4Voting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F5Register" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reference" TEXT,
    "decisionSummary" TEXT,
    "implementedAlternative" TEXT,
    "implementationDeadline" TEXT,
    "reviewDeadline" TEXT,
    "communicationChannels" TEXT[],
    "w5h2" JSONB,
    "stakeholders" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F5Register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F6Review" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "participants" TEXT,
    "f5Reference" TEXT,
    "reviewAnswers" JSONB,
    "goalAchieved" TEXT,
    "satisfactionLevel" INTEGER,
    "advisorAdequate" TEXT,
    "whatWorked" TEXT,
    "whatToImprove" TEXT,
    "futureRecs" TEXT,
    "archivedAt" TEXT,
    "reviewerSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F6Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[],
    "states" TEXT[],
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "modalities" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertMatch" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "entity" TEXT,
    "value" DOUBLE PRECISION,
    "state" TEXT,
    "publishedAt" TIMESTAMP(3),
    "url" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCache" (
    "id" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "params" TEXT,
    "responseData" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_idx" ON "LoginAttempt"("ip");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "DecisionCase_userId_idx" ON "DecisionCase"("userId");

-- CreateIndex
CREATE INDEX "DecisionCase_status_idx" ON "DecisionCase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "F1Problem_caseId_key" ON "F1Problem"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "F2DataCollection_caseId_key" ON "F2DataCollection"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "F4Voting_caseId_key" ON "F4Voting"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "F5Register_caseId_key" ON "F5Register"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "F6Review_caseId_key" ON "F6Review"("caseId");

-- CreateIndex
CREATE INDEX "AlertMatch_alertId_idx" ON "AlertMatch"("alertId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertMatch_alertId_externalId_key" ON "AlertMatch"("alertId", "externalId");

-- CreateIndex
CREATE INDEX "ApiCache_apiName_idx" ON "ApiCache"("apiName");

-- CreateIndex
CREATE INDEX "ApiCache_expiresAt_idx" ON "ApiCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiCache_apiName_endpoint_params_key" ON "ApiCache"("apiName", "endpoint", "params");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionCase" ADD CONSTRAINT "DecisionCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F1Problem" ADD CONSTRAINT "F1Problem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F2DataCollection" ADD CONSTRAINT "F2DataCollection_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F3Alternative" ADD CONSTRAINT "F3Alternative_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F4Voting" ADD CONSTRAINT "F4Voting_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F5Register" ADD CONSTRAINT "F5Register_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F6Review" ADD CONSTRAINT "F6Review_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertMatch" ADD CONSTRAINT "AlertMatch_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
