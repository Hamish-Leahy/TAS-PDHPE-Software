/*
  # Fix Master Admin Policies

  1. Changes
    - Fixes infinite recursion in master admin policies
    - Updates policy logic to prevent circular dependencies
    - Maintains secure access control
  
  2. Security
    - Only master admins can access sensitive settings
    - Prevents unauthorized access to admin controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Only master admins can read settings" ON master_admin_settings;
DROP POLICY IF EXISTS "Only master admins can modify settings" ON master_admin_settings;
DROP POLICY IF EXISTS "Only master admins can modify platform status" ON platform_status;

-- Create new policies with fixed logic
CREATE POLICY "Public can read master admin username"
  ON master_admin_settings
  FOR SELECT
  TO authenticated
  USING (key = 'master_admin_username');

CREATE POLICY "Master admin can read all settings"
  ON master_admin_settings
  FOR SELECT
  TO authenticated
  USING (
    current_user = (
      SELECT value FROM master_admin_settings 
      WHERE key = 'master_admin_username' 
      LIMIT 1
    )
  );

CREATE POLICY "Master admin can modify settings"
  ON master_admin_settings
  FOR ALL
  TO authenticated
  USING (
    current_user = (
      SELECT value FROM master_admin_settings 
      WHERE key = 'master_admin_username' 
      LIMIT 1
    )
  );

CREATE POLICY "Master admin can modify platform status"
  ON platform_status
  FOR ALL
  TO authenticated
  USING (
    current_user = (
      SELECT value FROM master_admin_settings 
      WHERE key = 'master_admin_username' 
      LIMIT 1
    )
  );