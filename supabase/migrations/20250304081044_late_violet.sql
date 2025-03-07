-- Check if admin_logs table exists before creating
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_logs') THEN
    -- Create admin_logs table if it doesn't exist
    CREATE TABLE admin_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      action text NOT NULL,
      user_id text NOT NULL,
      timestamp timestamptz DEFAULT now(),
      details text
    );

    -- Enable Row Level Security
    ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check if policies exist before creating them
DO $$
BEGIN
  -- Check for authenticated user policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_logs' AND policyname = 'Allow authenticated users to read admin logs'
  ) THEN
    CREATE POLICY "Allow authenticated users to read admin logs"
      ON admin_logs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_logs' AND policyname = 'Allow authenticated users to insert admin logs'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert admin logs"
      ON admin_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Check for anonymous user policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_logs' AND policyname = 'Allow anonymous users to read admin logs'
  ) THEN
    CREATE POLICY "Allow anonymous users to read admin logs"
      ON admin_logs
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_logs' AND policyname = 'Allow anonymous users to insert admin logs'
  ) THEN
    CREATE POLICY "Allow anonymous users to insert admin logs"
      ON admin_logs
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;