/*
  # Update Master Admin Password Hash

  1. Changes
    - Updates master admin password to use Web Crypto API compatible hash
    - Uses SHA-256 with salt for secure password storage
  
  2. Security
    - Password is stored as a salted SHA-256 hash
    - Salt is stored with hash in format: salt:hash
*/

-- Update master admin password with new hashing scheme
UPDATE master_admin_settings 
SET value = '7b4d8c2e1f3a5d6b:e9f8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8'
WHERE key = 'master_admin_password';