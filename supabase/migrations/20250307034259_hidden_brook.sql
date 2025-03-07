/*
  # Master Admin System Setup

  1. New Tables
    - `master_admin_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `platform_status`
      - `id` (uuid, primary key)
      - `platform` (text)
      - `status` (text)
      - `message` (text)
      - `last_updated` (timestamp)
      - `updated_by` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access only
*/

-- Create master_admin_settings table
CREATE TABLE IF NOT EXISTS master_admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create platform_status table
CREATE TABLE IF NOT EXISTS platform_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  message text,
  last_updated timestamptz DEFAULT now(),
  updated_by text NOT NULL
);

-- Enable RLS
ALTER TABLE master_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_status ENABLE ROW LEVEL SECURITY;

-- Create policies for master_admin_settings
CREATE POLICY "Only admins can read master_admin_settings"
  ON master_admin_settings
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM admin_settings 
    WHERE key = 'master_admin' 
    AND value = 'true'
    AND admin_settings.id::text = auth.uid()::text
  ));

CREATE POLICY "Only admins can modify master_admin_settings"
  ON master_admin_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM admin_settings 
    WHERE key = 'master_admin' 
    AND value = 'true'
    AND admin_settings.id::text = auth.uid()::text
  ));

-- Create policies for platform_status
CREATE POLICY "Anyone can read platform_status"
  ON platform_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify platform_status"
  ON platform_status
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM admin_settings 
    WHERE key = 'master_admin' 
    AND value = 'true'
    AND admin_settings.id::text = auth.uid()::text
  ));

-- Insert initial platform status for cross country
INSERT INTO platform_status (platform, status, message, updated_by)
VALUES ('cross_country', 'active', 'System operational', 'system')
ON CONFLICT (platform) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for master_admin_settings
CREATE TRIGGER update_master_admin_settings_updated_at
  BEFORE UPDATE ON master_admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();