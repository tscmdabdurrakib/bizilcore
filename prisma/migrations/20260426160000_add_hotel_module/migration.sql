-- Hotel module: add config columns to Shop, create Room/Booking/RoomServiceOrder/HousekeepingLog tables

-- Shop config columns
ALTER TABLE "Shop"
  ADD COLUMN IF NOT EXISTS "hotelCheckInTime"      TEXT    DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS "hotelCheckOutTime"     TEXT    DEFAULT '11:00',
  ADD COLUMN IF NOT EXISTS "hotelLateFeePerHour"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hotelEarlyFeePerHour"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hotelMinAdvancePct"    INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "hotelAutoHousekeeping" BOOLEAN NOT NULL DEFAULT true;

-- Room
CREATE TABLE IF NOT EXISTS "Room" (
  "id"           TEXT NOT NULL,
  "shopId"       TEXT NOT NULL,
  "number"       TEXT NOT NULL,
  "type"         TEXT NOT NULL DEFAULT 'single',
  "floor"        TEXT NOT NULL DEFAULT '1st',
  "capacity"     INTEGER NOT NULL DEFAULT 2,
  "ratePerNight" DOUBLE PRECISION NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'vacant',
  "amenities"    TEXT[] DEFAULT ARRAY[]::TEXT[],
  "description"  TEXT,
  "imageUrl"     TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Room_shopId_number_key" ON "Room"("shopId","number");
CREATE INDEX IF NOT EXISTS "Room_shopId_idx"  ON "Room"("shopId");
CREATE INDEX IF NOT EXISTS "Room_status_idx"  ON "Room"("status");

ALTER TABLE "Room"
  ADD CONSTRAINT "Room_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Booking
CREATE TABLE IF NOT EXISTS "Booking" (
  "id"            TEXT NOT NULL,
  "shopId"        TEXT NOT NULL,
  "bookingNumber" TEXT NOT NULL,
  "roomId"        TEXT NOT NULL,
  "customerId"    TEXT,
  "guestName"     TEXT NOT NULL,
  "guestPhone"    TEXT NOT NULL,
  "guestNID"      TEXT,
  "guestAddress"  TEXT,
  "adults"        INTEGER NOT NULL DEFAULT 1,
  "children"      INTEGER NOT NULL DEFAULT 0,
  "checkIn"       TIMESTAMP(3) NOT NULL,
  "checkOut"      TIMESTAMP(3) NOT NULL,
  "nights"        INTEGER NOT NULL,
  "ratePerNight"  DOUBLE PRECISION NOT NULL,
  "extraCharges"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "extraNote"     TEXT,
  "totalAmount"   DOUBLE PRECISION NOT NULL,
  "advancePaid"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dueAmount"     DOUBLE PRECISION NOT NULL,
  "paymentMethod" TEXT,
  "status"        TEXT NOT NULL DEFAULT 'confirmed',
  "source"        TEXT NOT NULL DEFAULT 'walk_in',
  "note"          TEXT,
  "checkedInAt"   TIMESTAMP(3),
  "checkedOutAt"  TIMESTAMP(3),
  "cancelledAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
CREATE INDEX IF NOT EXISTS "Booking_shopId_idx"   ON "Booking"("shopId");
CREATE INDEX IF NOT EXISTS "Booking_roomId_idx"   ON "Booking"("roomId");
CREATE INDEX IF NOT EXISTS "Booking_status_idx"   ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_checkIn_idx"  ON "Booking"("checkIn");
CREATE INDEX IF NOT EXISTS "Booking_checkOut_idx" ON "Booking"("checkOut");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_shopId_fkey"     FOREIGN KEY ("shopId")     REFERENCES "Shop"("id")     ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Booking_roomId_fkey"     FOREIGN KEY ("roomId")     REFERENCES "Room"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL  ON UPDATE CASCADE;

-- RoomServiceOrder
CREATE TABLE IF NOT EXISTS "RoomServiceOrder" (
  "id"        TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "item"      TEXT NOT NULL,
  "quantity"  INTEGER NOT NULL DEFAULT 1,
  "price"     DOUBLE PRECISION NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'pending',
  "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoomServiceOrder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RoomServiceOrder_bookingId_idx" ON "RoomServiceOrder"("bookingId");
ALTER TABLE "RoomServiceOrder"
  ADD CONSTRAINT "RoomServiceOrder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- HousekeepingLog
CREATE TABLE IF NOT EXISTS "HousekeepingLog" (
  "id"        TEXT NOT NULL,
  "shopId"    TEXT NOT NULL,
  "roomId"    TEXT NOT NULL,
  "staffId"   TEXT,
  "task"      TEXT NOT NULL DEFAULT 'cleaning',
  "status"    TEXT NOT NULL DEFAULT 'pending',
  "priority"  TEXT NOT NULL DEFAULT 'normal',
  "note"      TEXT,
  "startedAt" TIMESTAMP(3),
  "doneAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HousekeepingLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HousekeepingLog_shopId_idx" ON "HousekeepingLog"("shopId");
CREATE INDEX IF NOT EXISTS "HousekeepingLog_roomId_idx" ON "HousekeepingLog"("roomId");
CREATE INDEX IF NOT EXISTS "HousekeepingLog_status_idx" ON "HousekeepingLog"("status");

ALTER TABLE "HousekeepingLog"
  ADD CONSTRAINT "HousekeepingLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "HousekeepingLog_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
