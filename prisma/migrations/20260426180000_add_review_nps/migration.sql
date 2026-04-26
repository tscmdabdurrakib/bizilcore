-- AppReview & NPSSurvey models for Growth Feature 5

CREATE TABLE "AppReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "body" TEXT,
  "improvementNote" TEXT,
  "businessType" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "showOnSite" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppReview_userId_idx" ON "AppReview"("userId");
CREATE INDEX "AppReview_isApproved_showOnSite_idx" ON "AppReview"("isApproved", "showOnSite");

ALTER TABLE "AppReview" ADD CONSTRAINT "AppReview_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NPSSurvey" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NPSSurvey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NPSSurvey_userId_idx" ON "NPSSurvey"("userId");
CREATE INDEX "NPSSurvey_createdAt_idx" ON "NPSSurvey"("createdAt");

ALTER TABLE "NPSSurvey" ADD CONSTRAINT "NPSSurvey_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
