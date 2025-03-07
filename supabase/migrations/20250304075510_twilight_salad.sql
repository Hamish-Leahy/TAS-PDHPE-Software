/*
  # Fix runners table RLS policies

  1. Security
    - Drop existing policies for runners table
    - Create new policies for both authenticated and anonymous users
    - Ensure proper access to runners table
*/

-- First, drop all existing policies for runners to avoid conflicts
DO $$
BEGIN
  -- Drop SELECT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runners' AND policyname = 'Allow authenticated users to read runners'
  ) THEN
    DROP POLICY "Allow authenticated users to read runners" ON runners;
  END IF;

  -- Drop INSERT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runners' AND policyname = 'Allow authenticated users to insert runners'
  ) THEN
    DROP POLICY "Allow authenticated users to insert runners" ON runners;
  END IF;

  -- Drop UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runners' AND policyname = 'Allow authenticated users to update runners'
  ) THEN
    DROP POLICY "Allow authenticated users to update runners" ON runners;
  END IF;

  -- Drop DELETE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'runners' AND policyname = 'Allow authenticated users to delete runners'
  ) THEN
    DROP POLICY "Allow authenticated users to delete runners" ON runners;
  END IF;
END $$;

-- Ensure RLS is enabled on the runners table
ALTER TABLE runners ENABLE ROW LEVEL SECURITY;

-- Create fresh policies with proper permissions for authenticated users
CREATE POLICY "Allow authenticated users to read runners"
  ON runners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert runners"
  ON runners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update runners"
  ON runners
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete runners"
  ON runners
  FOR DELETE
  TO authenticated
  USING (true);

-- Also create policies for anon users (needed for public access)
CREATE POLICY "Allow anonymous users to read runners"
  ON runners
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert runners"
  ON runners
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update runners"
  ON runners
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to delete runners"
  ON runners
  FOR DELETE
  TO anon
  USING (true);