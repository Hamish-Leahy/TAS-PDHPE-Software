/*
  # Swimming Carnival Schema

  1. New Tables
    - `swimming_events`
      - Event details like stroke, distance, age group
      - Status tracking for event progress
    - `swimming_heats`
      - Heat assignments and scheduling
      - Lane allocations
    - `swimming_entries`
      - Student entries into events
      - Heat and lane assignments
    - `swimming_results`
      - Race times and placements
      - Records tracking
    - `swimming_records`
      - School records by event and age group
      - Historical record tracking

  2. Security
    - Enable RLS on all tables
    - Policies for coaches and officials
    - Read access for authenticated users
    - Write access for officials only

  3. Changes
    - Initial schema creation
    - Full event management structure
    - Results and records tracking
*/

-- Create swimming events table
CREATE TABLE IF NOT EXISTS swimming_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stroke text NOT NULL CHECK (stroke IN ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley')),
  distance integer NOT NULL,
  age_group text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create swimming heats table
CREATE TABLE IF NOT EXISTS swimming_heats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES swimming_events(id) ON DELETE CASCADE,
  heat_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create swimming entries table
CREATE TABLE IF NOT EXISTS swimming_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES swimming_events(id) ON DELETE CASCADE,
  heat_id uuid REFERENCES swimming_heats(id) ON DELETE SET NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  lane_number integer CHECK (lane_number BETWEEN 1 AND 8),
  seed_time numeric,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'scratched', 'dns', 'dnf', 'dq')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(heat_id, lane_number)
);

-- Create swimming results table
CREATE TABLE IF NOT EXISTS swimming_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES swimming_entries(id) ON DELETE CASCADE,
  finish_time numeric NOT NULL,
  place integer,
  is_record boolean DEFAULT false,
  notes text,
  recorded_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create swimming records table
CREATE TABLE IF NOT EXISTS swimming_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES swimming_events(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  time numeric NOT NULL,
  date_set date NOT NULL,
  competition_name text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE swimming_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE swimming_heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE swimming_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE swimming_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE swimming_records ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Swimming Events
CREATE POLICY "Allow authenticated read access to swimming events"
  ON swimming_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to swimming events"
  ON swimming_events
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);

-- Swimming Heats
CREATE POLICY "Allow authenticated read access to swimming heats"
  ON swimming_heats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to swimming heats"
  ON swimming_heats
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);

-- Swimming Entries
CREATE POLICY "Allow authenticated read access to swimming entries"
  ON swimming_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to swimming entries"
  ON swimming_entries
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);

-- Swimming Results
CREATE POLICY "Allow authenticated read access to swimming results"
  ON swimming_results
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to swimming results"
  ON swimming_results
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);

-- Swimming Records
CREATE POLICY "Allow authenticated read access to swimming records"
  ON swimming_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access to swimming records"
  ON swimming_records
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_swimming_events_updated_at
  BEFORE UPDATE ON swimming_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swimming_heats_updated_at
  BEFORE UPDATE ON swimming_heats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swimming_entries_updated_at
  BEFORE UPDATE ON swimming_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swimming_results_updated_at
  BEFORE UPDATE ON swimming_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swimming_records_updated_at
  BEFORE UPDATE ON swimming_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_swimming_events_status ON swimming_events(status);
CREATE INDEX idx_swimming_heats_event_id ON swimming_heats(event_id);
CREATE INDEX idx_swimming_entries_event_id ON swimming_entries(event_id);
CREATE INDEX idx_swimming_entries_heat_id ON swimming_entries(heat_id);
CREATE INDEX idx_swimming_entries_student_id ON swimming_entries(student_id);
CREATE INDEX idx_swimming_results_entry_id ON swimming_results(entry_id);
CREATE INDEX idx_swimming_records_event_id ON swimming_records(event_id);