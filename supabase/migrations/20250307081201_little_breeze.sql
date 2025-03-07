/*
  # TAS Biometrics System Tables

  1. New Tables
    - `students`: Core student information
    - `fitness_tests`: Test definitions and parameters
    - `test_results`: Student test results and measurements
    - `biometric_records`: Student biometric measurements
    - `fitness_standards`: Age and gender-specific fitness standards

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Restrict sensitive data access

  3. Data Relationships
    - Students link to test results and biometric records
    - Test results reference fitness tests and standards
*/

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  year_group integer NOT NULL,
  house text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_gender CHECK (gender IN ('male', 'female')),
  CONSTRAINT valid_house CHECK (house IN ('Broughton', 'Abbott', 'Croft', 'Tyrell', 'Green', 'Ross'))
);

-- Fitness tests definitions
CREATE TABLE IF NOT EXISTS fitness_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit text NOT NULL,
  measurement_type text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_measurement_type CHECK (measurement_type IN ('time', 'distance', 'repetitions', 'weight', 'height'))
);

-- Test results
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  test_id uuid REFERENCES fitness_tests(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  test_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Biometric records
CREATE TABLE IF NOT EXISTS biometric_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  height_cm numeric,
  weight_kg numeric,
  body_fat_percentage numeric,
  bmi numeric,
  measurement_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fitness standards
CREATE TABLE IF NOT EXISTS fitness_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES fitness_tests(id) ON DELETE CASCADE,
  age_group text NOT NULL,
  gender text NOT NULL,
  bronze_standard numeric NOT NULL,
  silver_standard numeric NOT NULL,
  gold_standard numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_gender CHECK (gender IN ('male', 'female'))
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_standards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read access to students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to fitness tests"
  ON fitness_tests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to biometric records"
  ON biometric_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to fitness standards"
  ON fitness_standards FOR SELECT
  TO authenticated
  USING (true);

-- Admin-only write policies
CREATE POLICY "Allow admin write access to students"
  ON students
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
  WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Allow admin write access to fitness tests"
  ON fitness_tests
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
  WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Allow admin write access to test results"
  ON test_results
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
  WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Allow admin write access to biometric records"
  ON biometric_records
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
  WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Allow admin write access to fitness standards"
  ON fitness_standards
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
  WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- Insert some default fitness tests
INSERT INTO fitness_tests (name, description, unit, measurement_type) VALUES
  ('Beep Test', '20m shuttle run test', 'level', 'distance'),
  ('Push-ups', 'Maximum push-ups in 1 minute', 'count', 'repetitions'),
  ('Sit-ups', 'Maximum sit-ups in 1 minute', 'count', 'repetitions'),
  ('1.6km Run', '1.6km (1 mile) run time', 'minutes', 'time'),
  ('Standing Jump', 'Standing long jump distance', 'cm', 'distance'),
  ('Sit and Reach', 'Flexibility test', 'cm', 'distance')
ON CONFLICT DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fitness_tests_updated_at
  BEFORE UPDATE ON fitness_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biometric_records_updated_at
  BEFORE UPDATE ON biometric_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fitness_standards_updated_at
  BEFORE UPDATE ON fitness_standards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();