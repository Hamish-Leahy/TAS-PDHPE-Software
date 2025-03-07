-- Add a race_id column to runners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'race_id'
  ) THEN
    ALTER TABLE runners ADD COLUMN race_id INTEGER REFERENCES race_events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create runner_races table for multiple event assignments
CREATE TABLE IF NOT EXISTS runner_races (
  id SERIAL PRIMARY KEY,
  runner_id INTEGER REFERENCES runners(id) ON DELETE CASCADE,
  race_id INTEGER REFERENCES race_events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(runner_id, race_id)
);

-- Enable Row Level Security
ALTER TABLE runner_races ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read runner_races"
  ON runner_races
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert runner_races"
  ON runner_races
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete runner_races"
  ON runner_races
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for anon users
CREATE POLICY "Allow anonymous users to read runner_races"
  ON runner_races
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert runner_races"
  ON runner_races
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete runner_races"
  ON runner_races
  FOR DELETE
  TO anon
  USING (true);