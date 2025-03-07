/*
  # Update Master Admin Credentials

  1. Changes
    - Update master admin username and password
    - Ensure credentials match the expected values

  2. Security
    - Maintain existing security policies
    - Update only credential values
*/

-- Update existing credentials or insert if not exists
DO $$
BEGIN
  -- First try to update existing credentials
  UPDATE master_admin_settings
  SET value = 'hleahy'
  WHERE key = 'master_admin_username';
  
  UPDATE master_admin_settings
  SET value = 'Pw45Ut09'
  WHERE key = 'master_admin_password';
  
  -- If no rows were updated, insert new credentials
  IF NOT FOUND THEN
    INSERT INTO master_admin_settings (key, value)
    VALUES 
      ('master_admin_username', 'hleahy'),
      ('master_admin_password', 'Pw45Ut09')
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value;
  END IF;
END $$;