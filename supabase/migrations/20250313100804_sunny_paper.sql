/*
  # Add Junior Age Groups and Multi-Finish Support

  1. Changes
    - Add age_group column to junior_races table
    - Add finish_line column to junior_races table
    - Add constraints for valid age groups
    - Add constraints for finish line numbers (1-3)
    - Add indexes for improved query performance
*/

-- Add age_group column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'junior_races' AND column_name = 'age_group'
  ) THEN
    ALTER TABLE junior_races 
    ADD COLUMN age_group text NOT NULL CHECK (age_group IN (
      'Under 6', 'Under 7', 'Under 8', 'Under 9', 'Under 10', 'Under 11', 'Under 12'
    ));
  END IF;
END $$;

-- Add finish_line column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'junior_races' AND column_name = 'finish_line'
  ) THEN
    ALTER TABLE junior_races 
    ADD COLUMN finish_line integer NOT NULL DEFAULT 1 CHECK (finish_line BETWEEN 1 AND 3);
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_junior_races_age_group ON junior_races(age_group);
CREATE INDEX IF NOT EXISTS idx_junior_races_finish_line ON junior_races(finish_line);

-- Insert initial races for 2025
INSERT INTO junior_races (name, grade, distance, date, age_group, finish_line) VALUES
-- Kindergarten Races
('K Girls 100m', 'K', 100, '2025-03-15', 'Under 6', 1),
('K Boys 100m', 'K', 100, '2025-03-15', 'Under 6', 1),

-- Year 1 Races  
('Year 1 Girls 200m', '1', 200, '2025-03-15', 'Under 7', 1),
('Year 1 Boys 200m', '1', 200, '2025-03-15', 'Under 7', 1),

-- Year 2 Races
('Year 2 Girls 400m', '2', 400, '2025-03-15', 'Under 8', 2),
('Year 2 Boys 400m', '2', 400, '2025-03-15', 'Under 8', 2),

-- Year 3 Races
('Year 3 Girls 800m', '3', 800, '2025-03-15', 'Under 9', 2),
('Year 3 Boys 800m', '3', 800, '2025-03-15', 'Under 9', 2),

-- Year 4 Races
('Year 4 Girls 1000m', '4', 1000, '2025-03-15', 'Under 10', 3),
('Year 4 Boys 1000m', '4', 1000, '2025-03-15', 'Under 10', 3),

-- Year 5 Races
('Year 5 Girls 1500m', '5', 1500, '2025-03-15', 'Under 11', 3),
('Year 5 Boys 1500m', '5', 1500, '2025-03-15', 'Under 11', 3),

-- Year 6 Races
('Year 6 Girls 2000m', '6', 2000, '2025-03-15', 'Under 12', 3),
('Year 6 Boys 2000m', '6', 2000, '2025-03-15', 'Under 12', 3);