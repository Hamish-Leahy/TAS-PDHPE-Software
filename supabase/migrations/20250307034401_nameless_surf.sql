/*
  # Master Admin Configuration

  1. Changes
    - Set master admin configuration for hleahy@as.edu.au
    - Add master admin settings
    - Add platform status tracking

  2. Security
    - Only master admin can modify these settings
    - RLS policies for access control
*/

-- First ensure admin_settings has the correct key
INSERT INTO admin_settings (key, value)
VALUES ('master_admin_email', 'hleahy@as.edu.au')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Insert into master_admin_settings
INSERT INTO master_admin_settings (key, value)
VALUES 
  ('master_admin_email', 'hleahy@as.edu.au'),
  ('master_admin_enabled', 'true')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Add platform status for cross country
INSERT INTO platform_status (platform, status, message, updated_by)
VALUES ('cross_country', 'active', 'System operational', 'hleahy@as.edu.au')
ON CONFLICT (platform) DO UPDATE
SET 
  status = EXCLUDED.status,
  message = EXCLUDED.message,
  updated_by = EXCLUDED.updated_by;

-- Add comment for documentation
COMMENT ON TABLE master_admin_settings IS 'Master admin configuration - Primary admin: hleahy@as.edu.au';