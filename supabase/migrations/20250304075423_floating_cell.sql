-- Create admin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  details text
);

-- Enable Row Level Security
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read admin logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert admin logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for anon users (needed for public access)
CREATE POLICY "Allow anonymous users to read admin logs"
  ON admin_logs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert admin logs"
  ON admin_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);