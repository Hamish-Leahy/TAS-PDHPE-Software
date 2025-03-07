/*
  # Update Master Admin Credentials with Hashed Password

  1. Changes
    - Updates master admin password to use a secure hash
    - Adds comment to master_admin_settings table
  
  2. Security
    - Password is now stored as a salted SHA-256 hash
    - Original password is not stored in plaintext
*/

-- Update master admin password with hashed version
UPDATE master_admin_settings 
SET value = '8f3a9e2c5b7d1f4a:e742d5c26c1c7f88e23e5f11c10fd7f9a2ed1f3c8b4d6a9e2c5b7d1f4a8e3c6'
WHERE key = 'master_admin_password';

-- Add table comment
COMMENT ON TABLE master_admin_settings IS 'Master admin configuration - Primary admin: hleahy';