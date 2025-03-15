/*
  # Coach Dashboard Features Schema

  1. Changes
    - Drop existing policies before recreating them
    - Add IF NOT EXISTS checks for tables and indexes
    - Keep all other functionality the same
*/

-- Drop existing policies first to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies for coach_communications
  DROP POLICY IF EXISTS "Coaches can view communications they sent or received" ON coach_communications;
  DROP POLICY IF EXISTS "Coaches can create communications" ON coach_communications;
  
  -- Drop policies for coach_timesheets
  DROP POLICY IF EXISTS "Coaches can view their own timesheets" ON coach_timesheets;
  DROP POLICY IF EXISTS "Coaches can manage their own timesheets" ON coach_timesheets;
  
  -- Drop policies for coach_incidents
  DROP POLICY IF EXISTS "Authenticated users can view incidents" ON coach_incidents;
  DROP POLICY IF EXISTS "Coaches can create and manage incidents" ON coach_incidents;
  
  -- Drop policies for coach_resources
  DROP POLICY IF EXISTS "Authenticated users can view resources" ON coach_resources;
  DROP POLICY IF EXISTS "Admin can manage resources" ON coach_resources;
  
  -- Drop policies for coach_resource_bookings
  DROP POLICY IF EXISTS "Authenticated users can view bookings" ON coach_resource_bookings;
  DROP POLICY IF EXISTS "Coaches can manage their bookings" ON coach_resource_bookings;
  
  -- Drop policies for coach_activities
  DROP POLICY IF EXISTS "Authenticated users can view activities" ON coach_activities;
  DROP POLICY IF EXISTS "Coaches can manage activities" ON coach_activities;
END $$;

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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_coach_communications_updated_at ON coach_communications;
DROP TRIGGER IF EXISTS update_coach_timesheets_updated_at ON coach_timesheets;
DROP TRIGGER IF EXISTS update_coach_incidents_updated_at ON coach_incidents;
DROP TRIGGER IF EXISTS update_coach_resources_updated_at ON coach_resources;
DROP TRIGGER IF EXISTS update_coach_resource_bookings_updated_at ON coach_resource_bookings;
DROP TRIGGER IF EXISTS update_coach_activities_updated_at ON coach_activities;

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

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_coach_communications_sender;
DROP INDEX IF EXISTS idx_coach_communications_recipient;
DROP INDEX IF EXISTS idx_coach_timesheets_coach;
DROP INDEX IF EXISTS idx_coach_incidents_reporter;
DROP INDEX IF EXISTS idx_coach_resource_bookings_resource;
DROP INDEX IF EXISTS idx_coach_resource_bookings_coach;
DROP INDEX IF EXISTS idx_coach_activities_created_by;

-- Create indexes
CREATE INDEX idx_coach_communications_sender ON coach_communications(sender_id);
CREATE INDEX idx_coach_communications_recipient ON coach_communications(recipient_id);
CREATE INDEX idx_coach_timesheets_coach ON coach_timesheets(coach_id);
CREATE INDEX idx_coach_incidents_reporter ON coach_incidents(reporter_id);
CREATE INDEX idx_coach_resource_bookings_resource ON coach_resource_bookings(resource_id);
CREATE INDEX idx_coach_resource_bookings_coach ON coach_resource_bookings(coach_id);
CREATE INDEX idx_coach_activities_created_by ON coach_activities(created_by);