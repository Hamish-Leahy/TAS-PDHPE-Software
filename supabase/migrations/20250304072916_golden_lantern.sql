/*
  # Create admin settings table (if not exists)

  1. Updates
    - Adds IF NOT EXISTS checks for all operations
    - Ensures policies are only created if they don't already exist
    - Maintains the same functionality as the original migration
*/

-- Check if table exists before creating
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

    -- Insert default admin password
    INSERT INTO admin_settings (key, value)
    VALUES ('admin_password', 'NewStart37#')
    ON CONFLICT (key) DO NOTHING;

    -- Enable Row Level Security
    ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
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