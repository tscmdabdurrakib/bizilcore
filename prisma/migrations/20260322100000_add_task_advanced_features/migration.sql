-- Add time tracking fields to Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "actualMinutes" INTEGER;

-- Create SubTask table
CREATE TABLE IF NOT EXISTS "SubTask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

-- Create indexes for SubTask
CREATE INDEX IF NOT EXISTS "SubTask_taskId_idx" ON "SubTask"("taskId");

-- Add foreign key constraint for SubTask -> Task (cascade delete)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SubTask_taskId_fkey'
    ) THEN
        ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_taskId_fkey"
            FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
