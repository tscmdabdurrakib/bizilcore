-- Replace the global unique on bookingNumber with a per-shop compound unique.
-- This avoids cross-tenant collisions (e.g., two shops generating BK-2026-001).

-- Drop existing global unique index (Prisma named it Booking_bookingNumber_key)
DROP INDEX IF EXISTS "Booking_bookingNumber_key";

-- Create compound unique index per shop
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_shopId_bookingNumber_key"
  ON "Booking" ("shopId", "bookingNumber");
