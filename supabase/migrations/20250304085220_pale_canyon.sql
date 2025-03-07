/*
  # Add race_id column to runners table

  1. Changes
    - Add race_id column to runners table to store race assignment
    - Add foreign key constraint to reference race_events table
*/

-- Add a race_id column to runners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'race_id'
  ) THEN
    ALTER TABLE runners ADD COLUMN race_id INTEGER REFERENCES race_events(id) ON DELETE CASCADE;
  END IF;
END $$;