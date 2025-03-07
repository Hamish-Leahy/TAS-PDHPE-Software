/*
  # Master Admin System Setup

  1. Tables
    - platform_status: Tracks status of different platform components
    - master_admin_settings: Stores master admin configuration
    - admin_logs: Audit trail for admin actions
  
  2. Security
    - Enables RLS on all tables
    - Sets up non-recursive policies for access control
    - Separates read and write permissions
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
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_key CHECK (key IN ('master_admin_username', 'master_admin_password'))
);

-- Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details jsonb,
  performed_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "platform_status_read_policy" ON platform_status;
DROP POLICY IF EXISTS "platform_status_modify_policy" ON platform_status;
DROP POLICY IF EXISTS "master_admin_settings_read_policy" ON master_admin_settings;
DROP POLICY IF EXISTS "master_admin_settings_modify_policy" ON master_admin_settings;
DROP POLICY IF EXISTS "admin_logs_read_policy" ON admin_logs;
DROP POLICY IF EXISTS "admin_logs_insert_policy" ON admin_logs;

-- Create policies for platform_status
CREATE POLICY "platform_status_read_policy"
  ON platform_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "platform_status_modify_policy"
  ON platform_status
  FOR ALL
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au');

-- Create policies for master_admin_settings
CREATE POLICY "master_admin_settings_read_policy"
  ON master_admin_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.email() = 'hleahy@as.edu.au' OR 
    key = 'master_admin_username'
  );

CREATE POLICY "master_admin_settings_modify_policy"
  ON master_admin_settings
  FOR ALL
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au');

-- Create policies for admin_logs
CREATE POLICY "admin_logs_read_policy"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "admin_logs_insert_policy"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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