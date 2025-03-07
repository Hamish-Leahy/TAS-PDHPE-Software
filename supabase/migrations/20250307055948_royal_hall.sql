/*
  # Fix Master Admin Settings Policies

  1. Changes
    - Remove recursive policies that were causing infinite recursion
    - Add proper row-level security policies for master admin settings
    - Ensure only authenticated users with proper permissions can access settings

  2. Security
    - Enable RLS on master_admin_settings table
    - Add policies for read/write access
    - Restrict access based on email domain and master admin status
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Only admins can modify master_admin_settings" ON master_admin_settings;
DROP POLICY IF EXISTS "Only admins can read master_admin_settings" ON master_admin_settings;
DROP POLICY IF EXISTS "master_admin_settings_admin_read_policy" ON master_admin_settings;
DROP POLICY IF EXISTS "master_admin_settings_modify_policy" ON master_admin_settings;
DROP POLICY IF EXISTS "master_admin_settings_public_read_policy" ON master_admin_settings;
DROP POLICY IF EXISTS "master_admin_settings_read_policy" ON master_admin_settings;

-- Enable RLS
ALTER TABLE master_admin_settings ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies
CREATE POLICY "allow_read_master_settings"
ON master_admin_settings
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'hleahy@as.edu.au') OR 
  (key = 'master_admin_username')
);

CREATE POLICY "allow_insert_master_settings"
ON master_admin_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "allow_update_master_settings"
ON master_admin_settings
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "allow_delete_master_settings"
ON master_admin_settings
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- Insert default master admin if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM master_admin_settings 
    WHERE key = 'master_admin_username'
  ) THEN
    INSERT INTO master_admin_settings (key, value)
    VALUES 
      ('master_admin_username', 'hleahy'),
      ('master_admin_password', 'NewStart37#');
  END IF;
END $$;