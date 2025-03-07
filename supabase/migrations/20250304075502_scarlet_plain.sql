/*
  # Fix race_events table RLS policies

  1. Security
    - Drop existing policies for race_events table
    - Create new policies for both authenticated and anonymous users
    - Ensure proper access to race_events table
*/

-- First, drop all existing policies for race_events to avoid conflicts
DO $$
BEGIN
  -- Drop SELECT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'race_events' AND policyname = 'Allow authenticated users to read race_events'
  ) THEN
    DROP POLICY "Allow authenticated users to read race_events" ON race_events;
  END IF;

  -- Drop INSERT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'race_events' AND policyname = 'Allow authenticated users to insert race_events'
  ) THEN
    DROP POLICY "Allow authenticated users to insert race_events" ON race_events;
  END IF;

  -- Drop UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'race_events' AND policyname = 'Allow authenticated users to update race_events'
  ) THEN
    DROP POLICY "Allow authenticated users to update race_events" ON race_events;
  END IF;

  -- Drop DELETE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'race_events' AND policyname = 'Allow authenticated users to delete race_events'
  ) THEN
    DROP POLICY "Allow authenticated users to delete race_events" ON race_events;
  END IF;
END $$;

-- Ensure RLS is enabled on the race_events table
ALTER TABLE race_events ENABLE ROW LEVEL SECURITY;

-- Create fresh policies with proper permissions for authenticated users
CREATE POLICY "Allow authenticated users to read race_events"
  ON race_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert race_events"
  ON race_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update race_events"
  ON race_events
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete race_events"
  ON race_events
  FOR DELETE
  TO authenticated
  USING (true);

-- Also create policies for anon users (needed for public access)
CREATE POLICY "Allow anonymous users to read race_events"
  ON race_events
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert race_events"
  ON race_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update race_events"
  ON race_events
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to delete race_events"
  ON race_events
  FOR DELETE
  TO anon
  USING (true);