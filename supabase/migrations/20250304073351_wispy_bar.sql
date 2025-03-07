/*
  # Fix house_points table RLS policies

  1. Updates
    - Adds INSERT policy for house_points table
    - Ensures all necessary policies exist for proper functionality
  
  This migration addresses the 401 error when trying to insert new house points
  by creating the proper RLS policies with conditional checks to prevent duplicates.
*/

-- Check if the INSERT policy exists for house_points, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to insert house_points'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert house_points"
      ON house_points
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure all other necessary policies exist
DO $$
BEGIN
  -- Check for SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to read house_points'
  ) THEN
    CREATE POLICY "Allow authenticated users to read house_points"
      ON house_points
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Check for UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to update house_points'
  ) THEN
    CREATE POLICY "Allow authenticated users to update house_points"
      ON house_points
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  -- Check for DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to delete house_points'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete house_points"
      ON house_points
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Ensure RLS is enabled on the house_points table
DO $$
BEGIN
  EXECUTE 'ALTER TABLE house_points ENABLE ROW LEVEL SECURITY;';
EXCEPTION
  WHEN others THEN
    -- RLS might already be enabled, which is fine
    NULL;
END $$;