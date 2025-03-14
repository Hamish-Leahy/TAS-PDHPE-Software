/*
  # Add Junior School Race Support

  1. New Tables
    - `junior_races`: Stores K-6 race events
    - `junior_runners`: Stores K-6 student runners
    - `junior_results`: Stores K-6 race results
    - `junior_house_points`: Stores K-6 house points

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for read access

  3. Changes
    - Add grade level constraints for K-6
    - Add age appropriate distance constraints
    - Add junior school specific house points tracking
*/

-- Create junior_races table
CREATE TABLE IF NOT EXISTS junior_races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade text NOT NULL CHECK (grade IN ('K', '1', '2', '3', '4', '5', '6')),
  distance integer NOT NULL CHECK (distance >= 100 AND distance <= 2000),
  date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create junior_runners table 
CREATE TABLE IF NOT EXISTS junior_runners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  grade text NOT NULL CHECK (grade IN ('K', '1', '2', '3', '4', '5', '6')),
  house text NOT NULL CHECK (house IN ('Broughton', 'Abbott', 'Croft', 'Tyrell', 'Green', 'Ross')),
  date_of_birth date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create junior_results table
CREATE TABLE IF NOT EXISTS junior_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  race_id uuid REFERENCES junior_races(id) ON DELETE CASCADE,
  runner_id uuid REFERENCES junior_runners(id) ON DELETE CASCADE,
  finish_time timestamptz,
  position integer,
  running_time_seconds integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(race_id, runner_id)
);

-- Create junior_house_points table
CREATE TABLE IF NOT EXISTS junior_house_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house text NOT NULL CHECK (house IN ('Broughton', 'Abbott', 'Croft', 'Tyrell', 'Green', 'Ross')),
  points integer NOT NULL,
  race_id uuid REFERENCES junior_races(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE junior_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE junior_runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE junior_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE junior_house_points ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to junior races"
  ON junior_races FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write access to junior races"
  ON junior_races FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to junior runners"
  ON junior_runners FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write access to junior runners"
  ON junior_runners FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to junior results"
  ON junior_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write access to junior results"
  ON junior_results FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to junior house points"
  ON junior_house_points FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin write access to junior house points"
  ON junior_house_points FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

-- Create updated_at triggers
CREATE TRIGGER update_junior_races_updated_at
  BEFORE UPDATE ON junior_races
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_junior_runners_updated_at
  BEFORE UPDATE ON junior_runners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_junior_results_updated_at
  BEFORE UPDATE ON junior_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_junior_races_grade ON junior_races(grade);
CREATE INDEX idx_junior_runners_grade ON junior_runners(grade);
CREATE INDEX idx_junior_results_race ON junior_results(race_id);
CREATE INDEX idx_junior_results_runner ON junior_results(runner_id);
CREATE INDEX idx_junior_house_points_house ON junior_house_points(house);
CREATE INDEX idx_junior_house_points_race ON junior_house_points(race_id);