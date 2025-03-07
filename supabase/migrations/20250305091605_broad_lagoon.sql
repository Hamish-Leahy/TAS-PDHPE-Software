-- Drop all existing tables and their data
DROP TABLE IF EXISTS runner_races CASCADE;
DROP TABLE IF EXISTS runners CASCADE;
DROP TABLE IF EXISTS race_events CASCADE;
DROP TABLE IF EXISTS house_points CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS help_requests CASCADE;

-- Recreate tables with clean structure
CREATE TABLE IF NOT EXISTS race_events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  house TEXT NOT NULL,
  age_group TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  finish_time TIMESTAMPTZ,
  position INTEGER,
  running_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runner_races (
  id SERIAL PRIMARY KEY,
  runner_id INTEGER REFERENCES runners(id) ON DELETE CASCADE,
  race_id INTEGER REFERENCES race_events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(runner_id, race_id)
);

CREATE TABLE IF NOT EXISTS house_points (
  id SERIAL PRIMARY KEY,
  house TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  details TEXT
);

CREATE TABLE IF NOT EXISTS help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  notes TEXT
);

-- Enable Row Level Security on all tables
ALTER TABLE race_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE runner_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Allow public access to race_events" ON race_events FOR ALL USING (true);
CREATE POLICY "Allow public access to runners" ON runners FOR ALL USING (true);
CREATE POLICY "Allow public access to runner_races" ON runner_races FOR ALL USING (true);
CREATE POLICY "Allow public access to house_points" ON house_points FOR ALL USING (true);
CREATE POLICY "Allow public access to admin_settings" ON admin_settings FOR ALL USING (true);
CREATE POLICY "Allow public access to admin_logs" ON admin_logs FOR ALL USING (true);
CREATE POLICY "Allow public access to help_requests" ON help_requests FOR ALL USING (true);

-- Insert default admin password
INSERT INTO admin_settings (key, value)
VALUES ('admin_password', 'NewStart37#')
ON CONFLICT (key) DO NOTHING;