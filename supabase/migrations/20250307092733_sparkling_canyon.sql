/*
  # Athletics Carnival Management System Schema

  1. New Tables
    - `carnival_events`: Defines different athletics events (100m, long jump, etc.)
    - `event_divisions`: Age/gender divisions for events
    - `event_heats`: Individual heats/rounds for track events
    - `athlete_entries`: Athletes registered for events
    - `event_results`: Records results for each athlete in each event
    - `carnival_records`: Tracks school records for each event
    
  2. Security
    - RLS enabled on all tables
    - Admin-only write access
    - Read access for all authenticated users
    
  3. Features
    - Automatic timestamps
    - Foreign key constraints
    - Performance indexes
    - Data validation
*/

-- Create carnival_events table
CREATE TABLE IF NOT EXISTS carnival_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  measurement_unit text NOT NULL,
  scoring_type text NOT NULL,
  min_value numeric,
  max_value numeric,
  decimal_places integer DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (type IN ('track', 'field', 'relay')),
  CONSTRAINT valid_scoring_type CHECK (scoring_type IN ('time', 'distance', 'height', 'points'))
);

-- Create event_divisions table
CREATE TABLE IF NOT EXISTS event_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES carnival_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_age integer,
  max_age integer,
  gender text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'mixed'))
);

-- Create event_heats table
CREATE TABLE IF NOT EXISTS event_heats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES carnival_events(id) ON DELETE CASCADE,
  division_id uuid REFERENCES event_divisions(id) ON DELETE CASCADE,
  heat_number integer NOT NULL,
  scheduled_time timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Create athlete_entries table
CREATE TABLE IF NOT EXISTS athlete_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  event_id uuid REFERENCES carnival_events(id) ON DELETE CASCADE,
  division_id uuid REFERENCES event_divisions(id) ON DELETE CASCADE,
  heat_id uuid REFERENCES event_heats(id) ON DELETE SET NULL,
  lane_number integer,
  status text DEFAULT 'registered',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_entry_status CHECK (status IN ('registered', 'scratched', 'dns', 'dnf', 'dq'))
);

-- Create event_results table
CREATE TABLE IF NOT EXISTS event_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES athlete_entries(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  attempt_number integer DEFAULT 1,
  wind_reading numeric,
  is_legal boolean DEFAULT true,
  notes text,
  recorded_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create carnival_records table
CREATE TABLE IF NOT EXISTS carnival_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES carnival_events(id) ON DELETE CASCADE,
  division_id uuid REFERENCES event_divisions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  value numeric NOT NULL,
  date_set date NOT NULL,
  competition_name text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_athlete_entries_student ON athlete_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_athlete_entries_event ON athlete_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_athlete_entries_division ON athlete_entries(division_id);
CREATE INDEX IF NOT EXISTS idx_event_results_entry ON event_results(entry_id);
CREATE INDEX IF NOT EXISTS idx_carnival_records_event ON carnival_records(event_id);
CREATE INDEX IF NOT EXISTS idx_carnival_records_division ON carnival_records(division_id);

-- Enable RLS
ALTER TABLE carnival_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE carnival_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin write access to carnival events"
  ON carnival_events FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to carnival events"
  ON carnival_events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to event divisions"
  ON event_divisions FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to event divisions"
  ON event_divisions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to event heats"
  ON event_heats FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to event heats"
  ON event_heats FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to athlete entries"
  ON athlete_entries FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to athlete entries"
  ON athlete_entries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to event results"
  ON event_results FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to event results"
  ON event_results FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to carnival records"
  ON carnival_records FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to carnival records"
  ON carnival_records FOR SELECT TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  -- Drop existing triggers first
  DROP TRIGGER IF EXISTS update_carnival_events_updated_at ON carnival_events;
  DROP TRIGGER IF EXISTS update_event_divisions_updated_at ON event_divisions;
  DROP TRIGGER IF EXISTS update_event_heats_updated_at ON event_heats;
  DROP TRIGGER IF EXISTS update_athlete_entries_updated_at ON athlete_entries;
  DROP TRIGGER IF EXISTS update_event_results_updated_at ON event_results;
  DROP TRIGGER IF EXISTS update_carnival_records_updated_at ON carnival_records;

  -- Create new triggers
  CREATE TRIGGER update_carnival_events_updated_at
    BEFORE UPDATE ON carnival_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_event_divisions_updated_at
    BEFORE UPDATE ON event_divisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_event_heats_updated_at
    BEFORE UPDATE ON event_heats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_athlete_entries_updated_at
    BEFORE UPDATE ON athlete_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_event_results_updated_at
    BEFORE UPDATE ON event_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_carnival_records_updated_at
    BEFORE UPDATE ON carnival_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;