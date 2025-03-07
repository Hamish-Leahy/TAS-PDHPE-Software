/*
  # Teams Management Schema

  1. New Tables
    - `coaches`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sport` (text)
      - `age_group` (text)
      - `coach_id` (uuid, foreign key)
      - `assistant_coach_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `team_players`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `position` (text)
      - `jersey_number` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for coaches to manage their teams

  3. Relationships
    - Teams to Coaches (many-to-one)
    - Teams to Players (many-to-many through team_players)
*/

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'coach',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport text NOT NULL,
  age_group text NOT NULL,
  coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  assistant_coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_players table
CREATE TABLE IF NOT EXISTS team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  position text,
  jersey_number integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, student_id)
);

-- Enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_players_updated_at
  BEFORE UPDATE ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies

-- Coaches policies
CREATE POLICY "Allow authenticated users to view coaches"
  ON coaches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow master admin to manage coaches"
  ON coaches FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'hleahy@as.edu.au');

-- Teams policies
CREATE POLICY "Allow authenticated users to view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow coaches to manage their teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches 
      WHERE email = (auth.jwt() ->> 'email')
    ) OR 
    assistant_coach_id IN (
      SELECT id FROM coaches 
      WHERE email = (auth.jwt() ->> 'email')
    ) OR
    (auth.jwt() ->> 'email') = 'hleahy@as.edu.au'
  );

-- Team players policies
CREATE POLICY "Allow authenticated users to view team players"
  ON team_players FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow coaches to manage their team players"
  ON team_players FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE coach_id IN (
        SELECT id FROM coaches 
        WHERE email = (auth.jwt() ->> 'email')
      ) OR 
      assistant_coach_id IN (
        SELECT id FROM coaches 
        WHERE email = (auth.jwt() ->> 'email')
      )
    ) OR
    (auth.jwt() ->> 'email') = 'hleahy@as.edu.au'
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_assistant_coach_id ON teams(assistant_coach_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_student_id ON team_players(student_id);