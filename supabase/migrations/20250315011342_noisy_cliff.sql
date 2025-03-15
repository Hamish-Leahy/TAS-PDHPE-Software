/*
  # Coach Dashboard Features Schema

  1. New Tables
    - `coach_communications`: Messages and announcements
    - `coach_timesheets`: Time tracking for coaches
    - `coach_incidents`: Incident reporting and tracking
    - `coach_resources`: Resource management and booking
    - `coach_activities`: Activity templates and selections
    
  2. Security
    - Enable RLS on all tables
    - Add policies for coach access
    - Add policies for admin access
*/

-- Create coach_communications table
CREATE TABLE IF NOT EXISTS coach_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES coaches(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('team', 'individual', 'all')),
  recipient_id uuid, -- References teams or individual students
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'read')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coach_timesheets table
CREATE TABLE IF NOT EXISTS coach_timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('training', 'game', 'meeting', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coach_incidents table
CREATE TABLE IF NOT EXISTS coach_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES coaches(id) ON DELETE CASCADE,
  incident_date date NOT NULL,
  incident_time time NOT NULL,
  location text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('injury', 'behavior', 'equipment', 'facility', 'other')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  action_taken text,
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coach_resources table
CREATE TABLE IF NOT EXISTS coach_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('equipment', 'facility', 'document', 'other')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'unavailable')),
  quantity integer DEFAULT 1,
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coach_resource_bookings table
CREATE TABLE IF NOT EXISTS coach_resource_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES coach_resources(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  quantity integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create coach_activities table
CREATE TABLE IF NOT EXISTS coach_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  equipment_needed text[],
  max_participants integer,
  created_by uuid REFERENCES coaches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coach_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_resource_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for coach_communications
CREATE POLICY "Coaches can view communications they sent or received"
  ON coach_communications FOR SELECT TO authenticated
  USING (
    sender_id IN (SELECT id FROM coaches WHERE email = auth.email()) OR
    (recipient_type = 'team' AND recipient_id IN (
      SELECT id FROM teams WHERE coach_id IN (
        SELECT id FROM coaches WHERE email = auth.email()
      ) OR assistant_coach_id IN (
        SELECT id FROM coaches WHERE email = auth.email()
      )
    )) OR
    recipient_type = 'all'
  );

CREATE POLICY "Coaches can create communications"
  ON coach_communications FOR INSERT TO authenticated
  WITH CHECK (
    auth.email() IN (SELECT email FROM coaches)
  );

-- Create policies for coach_timesheets
CREATE POLICY "Coaches can view their own timesheets"
  ON coach_timesheets FOR SELECT TO authenticated
  USING (
    coach_id IN (SELECT id FROM coaches WHERE email = auth.email()) OR
    auth.email() = 'hleahy@as.edu.au'
  );

CREATE POLICY "Coaches can manage their own timesheets"
  ON coach_timesheets FOR ALL TO authenticated
  USING (
    coach_id IN (SELECT id FROM coaches WHERE email = auth.email()) OR
    auth.email() = 'hleahy@as.edu.au'
  );

-- Create policies for coach_incidents
CREATE POLICY "Authenticated users can view incidents"
  ON coach_incidents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Coaches can create and manage incidents"
  ON coach_incidents FOR ALL TO authenticated
  USING (
    auth.email() IN (SELECT email FROM coaches) OR
    auth.email() = 'hleahy@as.edu.au'
  );

-- Create policies for coach_resources
CREATE POLICY "Authenticated users can view resources"
  ON coach_resources FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage resources"
  ON coach_resources FOR ALL TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au');

-- Create policies for coach_resource_bookings
CREATE POLICY "Authenticated users can view bookings"
  ON coach_resource_bookings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Coaches can manage their bookings"
  ON coach_resource_bookings FOR ALL TO authenticated
  USING (
    coach_id IN (SELECT id FROM coaches WHERE email = auth.email()) OR
    auth.email() = 'hleahy@as.edu.au'
  );

-- Create policies for coach_activities
CREATE POLICY "Authenticated users can view activities"
  ON coach_activities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Coaches can manage activities"
  ON coach_activities FOR ALL TO authenticated
  USING (
    created_by IN (SELECT id FROM coaches WHERE email = auth.email()) OR
    auth.email() = 'hleahy@as.edu.au'
  );

-- Create updated_at triggers
CREATE TRIGGER update_coach_communications_updated_at
  BEFORE UPDATE ON coach_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_timesheets_updated_at
  BEFORE UPDATE ON coach_timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_incidents_updated_at
  BEFORE UPDATE ON coach_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_resources_updated_at
  BEFORE UPDATE ON coach_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_resource_bookings_updated_at
  BEFORE UPDATE ON coach_resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_activities_updated_at
  BEFORE UPDATE ON coach_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_coach_communications_sender ON coach_communications(sender_id);
CREATE INDEX idx_coach_communications_recipient ON coach_communications(recipient_id);
CREATE INDEX idx_coach_timesheets_coach ON coach_timesheets(coach_id);
CREATE INDEX idx_coach_incidents_reporter ON coach_incidents(reporter_id);
CREATE INDEX idx_coach_resource_bookings_resource ON coach_resource_bookings(resource_id);
CREATE INDEX idx_coach_resource_bookings_coach ON coach_resource_bookings(coach_id);
CREATE INDEX idx_coach_activities_created_by ON coach_activities(created_by);