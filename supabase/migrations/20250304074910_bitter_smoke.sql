/*
  # Create admin_settings policies

  1. Security
    - Enable RLS on `admin_settings` table
    - Add policies for authenticated and anonymous users to perform CRUD operations
*/

-- First, drop all existing policies for admin_settings to avoid conflicts
DO $$
BEGIN
  -- Drop SELECT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow authenticated users to read admin settings'
  ) THEN
    DROP POLICY "Allow authenticated users to read admin settings" ON admin_settings;
  END IF;

  -- Drop INSERT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow authenticated users to insert admin settings'
  ) THEN
    DROP POLICY "Allow authenticated users to insert admin settings" ON admin_settings;
  END IF;

  -- Drop UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow authenticated users to update admin settings'
  ) THEN
    DROP POLICY "Allow authenticated users to update admin settings" ON admin_settings;
  END IF;

  -- Drop DELETE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow authenticated users to delete admin settings'
  ) THEN
    DROP POLICY "Allow authenticated users to delete admin settings" ON admin_settings;
  END IF;

  -- Drop anon policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow anonymous users to read admin settings'
  ) THEN
    DROP POLICY "Allow anonymous users to read admin settings" ON admin_settings;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow anonymous users to insert admin settings'
  ) THEN
    DROP POLICY "Allow anonymous users to insert admin settings" ON admin_settings;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow anonymous users to update admin settings'
  ) THEN
    DROP POLICY "Allow anonymous users to update admin settings" ON admin_settings;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow anonymous users to delete admin settings'
  ) THEN
    DROP POLICY "Allow anonymous users to delete admin settings" ON admin_settings;
  END IF;
END $$;

-- Ensure RLS is enabled on the admin_settings table
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create fresh policies with proper permissions for authenticated users
CREATE POLICY "Allow authenticated users to read admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert admin settings"
  ON admin_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update admin settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete admin settings"
  ON admin_settings
  FOR DELETE
  TO authenticated
  USING (true);

-- Also create policies for anon users (needed for public access)
CREATE POLICY "Allow anonymous users to read admin settings"
  ON admin_settings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert admin settings"
  ON admin_settings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update admin settings"
  ON admin_settings
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to delete admin settings"
  ON admin_settings
  FOR DELETE
  TO anon
  USING (true);