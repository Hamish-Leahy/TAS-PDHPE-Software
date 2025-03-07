/*
  # Update Runners Table Schema

  1. Changes
    - Remove student_id column
    - Add date_of_birth column
    - Update existing data
*/

-- Add date_of_birth column
ALTER TABLE runners ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Remove student_id column and its constraints
ALTER TABLE runners DROP COLUMN IF EXISTS student_id;

-- Drop the old unique constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'runners_student_id_key'
  ) THEN
    ALTER TABLE runners DROP CONSTRAINT runners_student_id_key;
  END IF;
END $$;