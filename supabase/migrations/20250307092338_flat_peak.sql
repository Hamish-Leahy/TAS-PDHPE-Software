/*
  # Biometrics and Fitness Testing Schema

  1. New Tables
    - `fitness_tests`: Test definitions and parameters
    - `test_results`: Individual student test results
    - `biometric_records`: Physical measurements tracking
    - `fitness_standards`: Achievement standards by age/gender
    
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

-- Create fitness_tests table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fitness_tests') THEN
    CREATE TABLE fitness_tests (
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
  END IF;
END $$;

-- Create test_results table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'test_results') THEN
    CREATE TABLE test_results (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid REFERENCES students(id) ON DELETE CASCADE,
      test_id uuid REFERENCES fitness_tests(id) ON DELETE CASCADE,
      value numeric NOT NULL,
      test_date date NOT NULL,
      notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create biometric_records table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'biometric_records') THEN
    CREATE TABLE biometric_records (
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
  END IF;
END $$;

-- Create fitness_standards table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fitness_standards') THEN
    CREATE TABLE fitness_standards (
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
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_results_student_id ON test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_biometric_records_student_id ON biometric_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fitness_standards_test_id ON fitness_standards(test_id);

-- Enable RLS
ALTER TABLE fitness_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_standards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow admin write access to fitness tests" ON fitness_tests;
  DROP POLICY IF EXISTS "Allow authenticated read access to fitness tests" ON fitness_tests;
  DROP POLICY IF EXISTS "Allow admin write access to test results" ON test_results;
  DROP POLICY IF EXISTS "Allow authenticated read access to test results" ON test_results;
  DROP POLICY IF EXISTS "Allow admin write access to biometric records" ON biometric_records;
  DROP POLICY IF EXISTS "Allow authenticated read access to biometric records" ON biometric_records;
  DROP POLICY IF EXISTS "Allow admin write access to fitness standards" ON fitness_standards;
  DROP POLICY IF EXISTS "Allow authenticated read access to fitness standards" ON fitness_standards;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for fitness_tests
CREATE POLICY "Allow admin write access to fitness tests"
  ON fitness_tests
  FOR ALL
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to fitness tests"
  ON fitness_tests
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for test_results
CREATE POLICY "Allow admin write access to test results"
  ON test_results
  FOR ALL
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to test results"
  ON test_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for biometric_records
CREATE POLICY "Allow admin write access to biometric records"
  ON biometric_records
  FOR ALL
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to biometric records"
  ON biometric_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for fitness_standards
CREATE POLICY "Allow admin write access to fitness standards"
  ON fitness_standards
  FOR ALL
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au')
  WITH CHECK (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "Allow authenticated read access to fitness standards"
  ON fitness_standards
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$ 
BEGIN
  -- Drop existing triggers first
  DROP TRIGGER IF EXISTS update_fitness_tests_updated_at ON fitness_tests;
  DROP TRIGGER IF EXISTS update_test_results_updated_at ON test_results;
  DROP TRIGGER IF EXISTS update_biometric_records_updated_at ON biometric_records;
  DROP TRIGGER IF EXISTS update_fitness_standards_updated_at ON fitness_standards;

  -- Create new triggers
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;