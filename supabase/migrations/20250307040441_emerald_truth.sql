/*
  # Fix Master Admin Policies

  1. Changes
    - Creates platform_status and master_admin_settings tables
    - Sets up proper RLS policies
    - Adds initial master admin credentials
    - Adds platform status entries
  
  2. Security
    - Only master admins can access sensitive settings
    - Public can read master admin username
    - Prevents unauthorized access to admin controls
*/

-- Create platform_status table if not exists
CREATE TABLE IF NOT EXISTS platform_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  message text,
  updated_by text NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Create master_admin_settings table if not exists
CREATE TABLE IF NOT EXISTS master_admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read platform status" ON platform_status;
DROP POLICY IF EXISTS "Master admin can modify platform status" ON platform_status;
DROP POLICY IF EXISTS "Public can read master admin username" ON master_admin_settings;
DROP POLICY IF EXISTS "Master admin can read all settings" ON master_admin_settings;
DROP POLICY IF EXISTS "Master admin can modify settings" ON master_admin_settings;

-- Create new policies for platform_status
CREATE POLICY "platform_status_read_policy"
  ON platform_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "platform_status_modify_policy"
  ON platform_status
  FOR ALL
  TO authenticated
  USING (
    current_user = (
      SELECT value 
      FROM master_admin_settings 
      WHERE key = 'master_admin_username'
      LIMIT 1
    )
  );

-- Create new policies for master_admin_settings
CREATE POLICY "master_admin_settings_public_read_policy"
  ON master_admin_settings
  FOR SELECT
  TO authenticated
  USING (key = 'master_admin_username');

CREATE POLICY "master_admin_settings_admin_read_policy"
  ON master_admin_settings
  FOR SELECT
  TO authenticated
  USING (
    current_user = (
      SELECT value 
      FROM master_admin_settings 
      WHERE key = 'master_admin_username'
      LIMIT 1
    )
  );

CREATE POLICY "master_admin_settings_modify_policy"
  ON master_admin_settings
  FOR ALL
  TO authenticated
  USING (
    current_user = (
      SELECT value 
      FROM master_admin_settings 
      WHERE key = 'master_admin_username'
      LIMIT 1
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for master_admin_settings
DROP TRIGGER IF EXISTS update_master_admin_settings_updated_at ON master_admin_settings;
CREATE TRIGGER update_master_admin_settings_updated_at
  BEFORE UPDATE ON master_admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial master admin credentials if they don't exist
INSERT INTO master_admin_settings (key, value)
VALUES 
  ('master_admin_username', 'hleahy')
ON CONFLICT (key) DO NOTHING;

-- Insert initial platform statuses if they don't exist
INSERT INTO platform_status (platform, status, message, updated_by)
VALUES 
  ('cross_country', 'active', 'System operational', 'hleahy'),
  ('master_admin', 'active', 'System operational', 'hleahy')
ON CONFLICT (platform) DO UPDATE
SET 
  status = EXCLUDED.status,
  message = EXCLUDED.message,
  updated_by = EXCLUDED.updated_by,
  last_updated = now();