/*
  # Add status column to carnival_events table

  1. Changes
    - Add status column to carnival_events table with default value 'pending'
    - Add check constraint to ensure valid status values
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'carnival_events' AND column_name = 'status'
  ) THEN
    ALTER TABLE carnival_events 
    ADD COLUMN status text NOT NULL DEFAULT 'pending';

    ALTER TABLE carnival_events
    ADD CONSTRAINT valid_carnival_status 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;