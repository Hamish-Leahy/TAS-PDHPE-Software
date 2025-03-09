/*
  # Add gender field to runners table

  1. Changes
    - Add gender field to runners table with three options: male, female, non-binary
    - Set default value to ensure backward compatibility
    - Add check constraint to validate gender values

  2. Security
    - Maintain existing RLS policies
*/

DO $$ BEGIN
  -- Add gender column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runners' AND column_name = 'gender'
  ) THEN
    ALTER TABLE runners 
    ADD COLUMN gender text NOT NULL DEFAULT 'male';

    -- Add check constraint for valid gender values
    ALTER TABLE runners
    ADD CONSTRAINT valid_gender_values 
    CHECK (gender IN ('male', 'female', 'non-binary'));
  END IF;
END $$;