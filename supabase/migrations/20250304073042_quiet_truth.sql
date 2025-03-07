/*
  # Fix admin settings table and ensure password exists

  1. Updates
    - Ensures admin_settings table exists
    - Ensures the admin_password entry exists with the correct value
    - Uses safer PL/pgSQL blocks with proper error handling
*/

-- First check if the table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_settings') THEN
    CREATE TABLE admin_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key text UNIQUE NOT NULL,
      value text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Ensure the admin password exists in the table
DO $$
BEGIN
  -- Check if the admin_password entry exists
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'admin_password') THEN
    -- Insert the default password
    INSERT INTO admin_settings (key, value)
    VALUES ('admin_password', 'NewStart37#');
  END IF;
END $$;

-- Check if policies exist before creating them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow authenticated users to read admin settings'
  ) THEN
    CREATE POLICY "Allow authenticated users to read admin settings"
      ON admin_settings
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_settings' AND policyname = 'Allow authenticated users to update admin settings'
  ) THEN
    CREATE POLICY "Allow authenticated users to update admin settings"
      ON admin_settings
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;