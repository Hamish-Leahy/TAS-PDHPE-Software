/*
  # Fix house_points table RLS policies

  1. Updates
    - Drops and recreates all RLS policies for house_points table
    - Ensures proper INSERT permissions for authenticated users
  
  This migration addresses the 401 error when trying to insert new house points
  by completely recreating the RLS policies with proper permissions.
*/

-- First, drop all existing policies for house_points to avoid conflicts
DO $$
BEGIN
  -- Drop SELECT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to read house_points'
  ) THEN
    DROP POLICY "Allow authenticated users to read house_points" ON house_points;
  END IF;

  -- Drop INSERT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to insert house_points'
  ) THEN
    DROP POLICY "Allow authenticated users to insert house_points" ON house_points;
  END IF;

  -- Drop UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to update house_points'
  ) THEN
    DROP POLICY "Allow authenticated users to update house_points" ON house_points;
  END IF;

  -- Drop DELETE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to delete house_points'
  ) THEN
    DROP POLICY "Allow authenticated users to delete house_points" ON house_points;
  END IF;
END $$;

-- Ensure RLS is enabled on the house_points table
ALTER TABLE house_points ENABLE ROW LEVEL SECURITY;

-- Create fresh policies with proper permissions
CREATE POLICY "Allow authenticated users to read house_points"
  ON house_points
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert house_points"
  ON house_points
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update house_points"
  ON house_points
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete house_points"
  ON house_points
  FOR DELETE
  TO authenticated
  USING (true);

-- Also create policies for anon users (needed for public access)
CREATE POLICY "Allow anonymous users to read house_points"
  ON house_points
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert house_points"
  ON house_points
  FOR INSERT
  TO anon
  WITH CHECK (true);