/*
  # Update Race System for Combined Junior/Senior Events
  
  1. Changes
    - Add grade field to runners table for junior/senior distinction
    - Add finish_line field to race_events table
    - Add constraints and indexes
    - Insert races for April 10th
*/

-- Add grade column to runners if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runners' AND column_name = 'grade'
  ) THEN
    ALTER TABLE runners 
    ADD COLUMN grade text CHECK (grade IN ('K', '1', '2', '3', '4', '5', '6', 'Senior'));
  END IF;
END $$;

-- Add finish_line column to race_events if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'race_events' AND column_name = 'finish_line'
  ) THEN
    ALTER TABLE race_events 
    ADD COLUMN finish_line integer NOT NULL DEFAULT 1 CHECK (finish_line BETWEEN 1 AND 3);
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_runners_grade ON runners(grade);
CREATE INDEX IF NOT EXISTS idx_race_events_finish_line ON race_events(finish_line);

-- Insert races for April 10th, 2025
INSERT INTO race_events (name, date, status, finish_line) VALUES
-- Junior Races - Finish Line 1 (Short Distances)
('100m Junior - Kindergarten Girls', '2025-04-10', 'pending', 1),
('100m Junior - Kindergarten Boys', '2025-04-10', 'pending', 1),
('200m Junior - Year 1 Girls', '2025-04-10', 'pending', 1),
('200m Junior - Year 1 Boys', '2025-04-10', 'pending', 1),

-- Junior Races - Finish Line 2 (Medium Distances)  
('400m Junior - Year 2 Girls', '2025-04-10', 'pending', 2),
('400m Junior - Year 2 Boys', '2025-04-10', 'pending', 2),
('800m Junior - Year 3 Girls', '2025-04-10', 'pending', 2),
('800m Junior - Year 3 Boys', '2025-04-10', 'pending', 2),

-- Junior Races - Finish Line 3 (Long Distances)
('1000m Junior - Year 4 Girls', '2025-04-10', 'pending', 3),
('1000m Junior - Year 4 Boys', '2025-04-10', 'pending', 3),
('1500m Junior - Year 5 Girls', '2025-04-10', 'pending', 3),
('1500m Junior - Year 5 Boys', '2025-04-10', 'pending', 3),
('2000m Junior - Year 6 Girls', '2025-04-10', 'pending', 3),
('2000m Junior - Year 6 Boys', '2025-04-10', 'pending', 3),

-- Senior Races - Finish Line 3
('3000m Senior - Under 13 Girls', '2025-04-10', 'pending', 3),
('3000m Senior - Under 13 Boys', '2025-04-10', 'pending', 3),
('3000m Senior - Under 14 Girls', '2025-04-10', 'pending', 3), 
('3000m Senior - Under 14 Boys', '2025-04-10', 'pending', 3),
('5000m Senior - Under 15 Girls', '2025-04-10', 'pending', 3),
('5000m Senior - Under 15 Boys', '2025-04-10', 'pending', 3),
('5000m Senior - Under 16 Girls', '2025-04-10', 'pending', 3),
('5000m Senior - Under 16 Boys', '2025-04-10', 'pending', 3),
('5000m Senior - Open Girls', '2025-04-10', 'pending', 3),
('5000m Senior - Open Boys', '2025-04-10', 'pending', 3);