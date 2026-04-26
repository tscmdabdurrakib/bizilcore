-- Enforce one review per user at the DB level (race-safe).
-- Drop the now-redundant single-column index, then add a unique constraint.

DROP INDEX IF EXISTS "AppReview_userId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "AppReview_userId_key" ON "AppReview"("userId");
