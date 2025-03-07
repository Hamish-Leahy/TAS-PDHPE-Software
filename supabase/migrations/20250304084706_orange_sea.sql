/*
  # Add running_time_seconds column to runners table

  1. Changes
    - Add running_time_seconds column to runners table to store the actual running time in seconds
*/

-- Add running_time_seconds column to runners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'running_time_seconds'
  ) THEN
    ALTER TABLE runners ADD COLUMN running_time_seconds INTEGER;
  END IF;
END $$;