/*
  # Master Admin System Tables

  1. New Tables
    - `users`: System users with roles and access control
    - `login_attempts`: Track login attempts for security monitoring
    - `system_settings`: System-wide configuration settings
    - `admin_notifications`: System notifications and alerts

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Restrict access to admin users where appropriate

  3. Initial Data
    - Create default system settings
    - Add initial admin user
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_sign_in timestamptz,
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access to users"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- Login attempts tracking
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to view login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Allow system to insert login attempts"
  ON login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access to system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- Admin notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('info', 'warning', 'error'))
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access to notifications"
  ON admin_notifications
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- Insert initial system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable system maintenance mode'),
  ('max_login_attempts', '5', 'Maximum number of failed login attempts before lockout'),
  ('session_timeout', '3600', 'Session timeout in seconds'),
  ('backup_retention_days', '30', 'Number of days to retain system backups')
ON CONFLICT (key) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();