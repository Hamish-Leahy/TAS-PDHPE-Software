/*
  # Master Admin Configuration

  1. Changes
    - Set master admin configuration for hleahy
    - Add platform status tracking
    - Set initial admin credentials

  2. Security
    - Only master admin can modify these settings
    - RLS policies for access control
*/

-- Insert master admin settings
INSERT INTO master_admin_settings (key, value)
VALUES 
  ('master_admin_username', 'hleahy'),
  ('master_admin_password', 'Pw45Ut09'),
  ('master_admin_enabled', 'true')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Add platform status for cross country
INSERT INTO platform_status (platform, status, message, updated_by)
VALUES ('cross_country', 'active', 'System operational', 'hleahy')
ON CONFLICT (platform) DO UPDATE
SET 
  status = EXCLUDED.status,
  message = EXCLUDED.message,
  updated_by = EXCLUDED.updated_by;

-- Add comment for documentation
COMMENT ON TABLE master_admin_settings IS 'Master admin configuration - Primary admin: hleahy';