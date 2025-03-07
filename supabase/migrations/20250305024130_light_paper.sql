-- Create help_requests table
CREATE TABLE IF NOT EXISTS help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  notes text
);

-- Enable Row Level Security
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read help_requests"
  ON help_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert help_requests"
  ON help_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update help_requests"
  ON help_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for anon users
CREATE POLICY "Allow anonymous users to read help_requests"
  ON help_requests
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert help_requests"
  ON help_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);