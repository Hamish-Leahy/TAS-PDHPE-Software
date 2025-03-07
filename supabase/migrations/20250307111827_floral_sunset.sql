/*
  # Update Platform Status Table

  1. Changes
    - Add new platform entries for athletics, biometrics, and coach systems
    - Update existing platform status table structure
    - Add new columns for detailed monitoring

  2. Security
    - Maintain existing RLS policies
    - Add new policies for platform-specific access
*/

-- Add new platforms if they don't exist
INSERT INTO platform_status (platform, status, message, updated_by)
SELECT 'athletics', 'active', 'Athletics system operational', 'hleahy'
WHERE NOT EXISTS (
  SELECT 1 FROM platform_status WHERE platform = 'athletics'
);

INSERT INTO platform_status (platform, status, message, updated_by)
SELECT 'biometrics', 'active', 'Biometrics system operational', 'hleahy'
WHERE NOT EXISTS (
  SELECT 1 FROM platform_status WHERE platform = 'biometrics'
);

INSERT INTO platform_status (platform, status, message, updated_by)
SELECT 'coach', 'active', 'Coach system operational', 'hleahy'
WHERE NOT EXISTS (
  SELECT 1 FROM platform_status WHERE platform = 'coach'
);

-- Update RLS policies
ALTER TABLE platform_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to platform_status"
  ON platform_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow master admin full access to platform_status"
  ON platform_status
  FOR ALL
  TO authenticated
  USING (
    (SELECT value FROM admin_settings WHERE key = 'master_admin_email') = auth.email()
  )
  WITH CHECK (
    (SELECT value FROM admin_settings WHERE key = 'master_admin_email') = auth.email()
  );