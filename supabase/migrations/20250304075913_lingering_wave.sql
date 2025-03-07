/*
  # Add cascade delete for race events

  1. Changes
    - Add cascade delete for race_events to ensure proper cleanup when races are deleted
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