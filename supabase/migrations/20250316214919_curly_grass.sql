/*
  # Special Events Platform Schema

  1. New Tables
    - `ocean_swim_participants`
    - `city2surf_participants`
    - `nineteen_participants`
    - Associated tracking and results tables
  
  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for participant access
*/

-- Ocean Swim Tables
CREATE TABLE IF NOT EXISTS ocean_swim_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  swim_level text NOT NULL,
  medical_clearance boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocean_swim_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  location text NOT NULL,
  conditions text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocean_swim_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES ocean_swim_participants(id) ON DELETE CASCADE,
  session_id uuid REFERENCES ocean_swim_sessions(id) ON DELETE CASCADE,
  status text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- City2Surf Tables
CREATE TABLE IF NOT EXISTS city2surf_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  estimated_time interval,
  training_group text,
  medical_clearance boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS city2surf_training_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  route text NOT NULL,
  distance integer NOT NULL,
  weather_conditions text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS city2surf_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES city2surf_participants(id) ON DELETE CASCADE,
  training_run_id uuid REFERENCES city2surf_training_runs(id) ON DELETE CASCADE,
  completion_time interval,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 19 For 19 Tables
CREATE TABLE IF NOT EXISTS nineteen_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  total_days_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nineteen_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES nineteen_participants(id) ON DELETE CASCADE,
  date date NOT NULL,
  activity_type text NOT NULL,
  duration_minutes integer DEFAULT 19,
  intensity_rating integer CHECK (intensity_rating BETWEEN 1 AND 10),
  notes text,
  photo_url text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ocean_swim_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocean_swim_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocean_swim_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE city2surf_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE city2surf_training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE city2surf_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE nineteen_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nineteen_daily_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for ocean swim tables
CREATE POLICY "Allow authenticated read access to ocean swim participants"
  ON ocean_swim_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write access to ocean swim participants"
  ON ocean_swim_participants FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

-- Create policies for city2surf tables
CREATE POLICY "Allow authenticated read access to city2surf participants"
  ON city2surf_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write access to city2surf participants"
  ON city2surf_participants FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

-- Create policies for nineteen tables
CREATE POLICY "Allow authenticated read access to nineteen participants"
  ON nineteen_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write access to nineteen participants"
  ON nineteen_participants FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

-- Create updated_at triggers
CREATE TRIGGER update_ocean_swim_participants_updated_at
  BEFORE UPDATE ON ocean_swim_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocean_swim_sessions_updated_at
  BEFORE UPDATE ON ocean_swim_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city2surf_participants_updated_at
  BEFORE UPDATE ON city2surf_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city2surf_training_runs_updated_at
  BEFORE UPDATE ON city2surf_training_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nineteen_participants_updated_at
  BEFORE UPDATE ON nineteen_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add platform status entries
INSERT INTO platform_status (platform, status, message, updated_by)
VALUES 
  ('ocean_swim', 'active', 'Ocean Swim program is active', 'system'),
  ('city2surf', 'active', 'City2Surf program is active', 'system'),
  ('19for19', 'active', '19 For 19 challenge is active', 'system')
ON CONFLICT (platform) DO UPDATE
SET 
  status = EXCLUDED.status,
  message = EXCLUDED.message,
  updated_by = EXCLUDED.updated_by,
  last_updated = now();