/*
  # Master Admin System Schema

  1. New Tables
    - `platform_status`: Track status of different platform components
      - `id` (uuid, primary key)
      - `platform` (text, unique)
      - `status` (text)
      - `message` (text)
      - `updated_by` (text)
      - `last_updated` (timestamptz)

    - `master_admin_settings`: Configuration for master admin system
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for master admin access
*/

-- Create platform_status table
CREATE TABLE IF NOT EXISTS platform_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  message text,
  updated_by text NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Create master_admin_settings table
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

-- Create policies for platform_status
CREATE POLICY "Anyone can read platform status"
  ON platform_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only master admins can modify platform status"
  ON platform_status
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_admin_settings
      WHERE key = 'master_admin_username'
      AND value = current_user
    )
  );

-- Create policies for master_admin_settings
CREATE POLICY "Only master admins can read settings"
  ON master_admin_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_admin_settings
      WHERE key = 'master_admin_username'
      AND value = current_user
    )
  );

CREATE POLICY "Only master admins can modify settings"
  ON master_admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_admin_settings
      WHERE key = 'master_admin_username'
      AND value = current_user
    )
  );

-- Insert initial master admin credentials
INSERT INTO master_admin_settings (key, value)
VALUES 
  ('master_admin_username', 'hleahy'),
  ('master_admin_password', 'Pw45Ut09')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Insert initial platform statuses
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

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_master_admin_settings_updated_at ON master_admin_settings;
CREATE TRIGGER update_master_admin_settings_updated_at
    BEFORE UPDATE ON master_admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();