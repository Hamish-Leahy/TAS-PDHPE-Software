-- Drop existing policies first to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can view rooms" ON coach_resources;
  DROP POLICY IF EXISTS "Admin can manage rooms" ON coach_resources;
  DROP POLICY IF EXISTS "Coaches can view all bookings" ON coach_resource_bookings;
  DROP POLICY IF EXISTS "Coaches can manage their bookings" ON coach_resource_bookings;
  DROP POLICY IF EXISTS "Authenticated users can view resources" ON coach_resources;
  DROP POLICY IF EXISTS "Admin can manage resources" ON coach_resources;
  DROP POLICY IF EXISTS "Authenticated users can view bookings" ON coach_resource_bookings;
  DROP POLICY IF EXISTS "Coaches can manage bookings" ON coach_resource_bookings;
END $$;

-- Update coach_resources table for rooms
ALTER TABLE coach_resources DROP CONSTRAINT IF EXISTS coach_resources_type_check;
ALTER TABLE coach_resources ADD CONSTRAINT coach_resources_type_check 
  CHECK (type IN ('room', 'gym', 'field', 'court', 'other'));

-- Add room-specific fields
ALTER TABLE coach_resources 
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS facilities text[],
  ADD COLUMN IF NOT EXISTS floor_level text,
  ADD COLUMN IF NOT EXISTS building text;

-- Delete existing rooms first
DELETE FROM coach_resources WHERE name IN ('Gym 01', 'Gym 02', 'Green Room', 'Weights Room');

-- Add unique constraint on name
ALTER TABLE coach_resources DROP CONSTRAINT IF EXISTS coach_resources_name_key;
ALTER TABLE coach_resources ADD CONSTRAINT coach_resources_name_key UNIQUE (name);

-- Insert default rooms
INSERT INTO coach_resources (
  name,
  type,
  status,
  location,
  capacity,
  facilities,
  floor_level,
  building,
  notes
) VALUES 
  (
    'Gym 01',
    'gym',
    'available',
    'Main Building',
    50,
    ARRAY['Air Conditioning', 'Sound System', 'Basketball Hoops', 'Volleyball Net'],
    'Ground Floor',
    'Sports Complex',
    'Main gymnasium with full basketball court'
  ),
  (
    'Gym 02',
    'gym',
    'available',
    'Main Building',
    50,
    ARRAY['Air Conditioning', 'Sound System', 'Basketball Hoops', 'Volleyball Net'],
    'Ground Floor',
    'Sports Complex',
    'Secondary gymnasium with full basketball court'
  ),
  (
    'Green Room',
    'room',
    'available',
    'Sports Complex',
    30,
    ARRAY['Air Conditioning', 'Tables', 'Chairs', 'Whiteboard'],
    'First Floor',
    'Sports Complex',
    'Multi-purpose room for team meetings and activities'
  ),
  (
    'Weights Room',
    'gym',
    'available',
    'Sports Complex',
    20,
    ARRAY['Air Conditioning', 'Weight Equipment', 'Cardio Machines', 'Mirrors'],
    'Ground Floor',
    'Sports Complex',
    'Fully equipped weights and conditioning room'
  );

-- Update coach_resource_bookings table
ALTER TABLE coach_resource_bookings
  ADD COLUMN IF NOT EXISTS training_session_id uuid REFERENCES training_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS attendees_count integer,
  ADD COLUMN IF NOT EXISTS recurring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_pattern text,
  ADD COLUMN IF NOT EXISTS recurrence_end_date date;

-- Create index for training session integration
CREATE INDEX IF NOT EXISTS idx_resource_bookings_training_session 
  ON coach_resource_bookings(training_session_id);

-- Create new policies with unique names
CREATE POLICY "resources_read_policy"
  ON coach_resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "resources_admin_policy"
  ON coach_resources
  FOR ALL
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au');

CREATE POLICY "bookings_read_policy"
  ON coach_resource_bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bookings_manage_policy"
  ON coach_resource_bookings
  FOR ALL
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE email = auth.email()
    ) OR auth.email() = 'hleahy@as.edu.au'
  );

-- Create function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_resource_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_booking_id uuid DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM coach_resource_bookings
    WHERE resource_id = p_resource_id
      AND booking_date = p_booking_date
      AND status != 'rejected'
      AND id != COALESCE(p_booking_id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (start_time <= p_start_time AND end_time > p_start_time)
        OR (start_time < p_end_time AND end_time >= p_end_time)
        OR (start_time >= p_start_time AND end_time <= p_end_time)
      )
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent booking conflicts
CREATE OR REPLACE FUNCTION prevent_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF check_booking_conflict(
    NEW.resource_id,
    NEW.booking_date,
    NEW.start_time,
    NEW.end_time,
    NEW.id
  ) THEN
    RAISE EXCEPTION 'Booking conflict: The resource is already booked for this time period';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_booking_conflict ON coach_resource_bookings;
CREATE TRIGGER check_booking_conflict
  BEFORE INSERT OR UPDATE ON coach_resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_booking_conflict();

-- Create function to update resource status
CREATE OR REPLACE FUNCTION update_resource_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update resource status based on bookings
  UPDATE coach_resources
  SET status = CASE
    WHEN EXISTS (
      SELECT 1 FROM coach_resource_bookings
      WHERE resource_id = NEW.resource_id
        AND booking_date = CURRENT_DATE
        AND start_time <= CURRENT_TIME
        AND end_time > CURRENT_TIME
        AND status = 'approved'
    ) THEN 'in_use'
    ELSE 'available'
  END
  WHERE id = NEW.resource_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resource_status_on_booking ON coach_resource_bookings;
CREATE TRIGGER update_resource_status_on_booking
  AFTER INSERT OR UPDATE ON coach_resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_status();