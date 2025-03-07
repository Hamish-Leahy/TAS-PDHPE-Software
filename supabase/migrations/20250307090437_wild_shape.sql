/*
  # Coach System Schema

  1. New Tables
    - coaches: Store coach information
    - teams: Store team information
    - team_players: Link students to teams with position/jersey info
    - training_sessions: Store training session details
    - attendance_records: Track attendance for training sessions
    - training_plans: Store training plan templates
    - training_activities: Store activities within training plans

  2. Security
    - Enable RLS on all tables
    - Add policies for coaches to manage their teams
    - Add policies for viewing team data

  3. Changes
    - Add indexes for performance
    - Add triggers for updated_at columns
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS training_activities CASCADE;
DROP TABLE IF EXISTS training_plans CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS team_players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;

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

-- Create training_sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- Create training_plans table
CREATE TABLE IF NOT EXISTS training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training_activities table
CREATE TABLE IF NOT EXISTS training_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES training_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  sequence_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_activities ENABLE ROW LEVEL SECURITY;

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Training sessions policies
CREATE POLICY "Allow authenticated users to view training sessions"
  ON training_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow coaches to manage their training sessions"
  ON training_sessions FOR ALL
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

-- Attendance records policies
CREATE POLICY "Allow authenticated users to view attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow coaches to manage attendance records"
  ON attendance_records FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM training_sessions
      WHERE team_id IN (
        SELECT id FROM teams 
        WHERE coach_id IN (
          SELECT id FROM coaches 
          WHERE email = (auth.jwt() ->> 'email')
        ) OR 
        assistant_coach_id IN (
          SELECT id FROM coaches 
          WHERE email = (auth.jwt() ->> 'email')
        )
      )
    ) OR
    (auth.jwt() ->> 'email') = 'hleahy@as.edu.au'
  );

-- Training plans policies
CREATE POLICY "Allow authenticated users to view training plans"
  ON training_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow coaches to manage training plans"
  ON training_plans FOR ALL
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

-- Training activities policies
CREATE POLICY "Allow authenticated users to view training activities"
  ON training_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow coaches to manage training activities"
  ON training_activities FOR ALL
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM training_plans
      WHERE team_id IN (
        SELECT id FROM teams 
        WHERE coach_id IN (
          SELECT id FROM coaches 
          WHERE email = (auth.jwt() ->> 'email')
        ) OR 
        assistant_coach_id IN (
          SELECT id FROM coaches 
          WHERE email = (auth.jwt() ->> 'email')
        )
      )
    ) OR
    (auth.jwt() ->> 'email') = 'hleahy@as.edu.au'
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_assistant_coach_id ON teams(assistant_coach_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_student_id ON team_players(student_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_team_id ON training_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_team_id ON training_plans(team_id);
CREATE INDEX IF NOT EXISTS idx_training_activities_plan_id ON training_activities(plan_id);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_coaches_updated_at ON coaches;
CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_players_updated_at ON team_players;
CREATE TRIGGER update_team_players_updated_at
  BEFORE UPDATE ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans;
CREATE TRIGGER update_training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_activities_updated_at ON training_activities;
CREATE TRIGGER update_training_activities_updated_at
  BEFORE UPDATE ON training_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();