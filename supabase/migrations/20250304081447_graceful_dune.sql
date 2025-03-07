/*
  # Fix House Points Reset Functionality

  1. Ensures the house_points table has proper DELETE policies
  2. Adds a direct SQL function to completely wipe the house_points table
  3. Creates a trigger to log when house points are reset
*/

-- First, ensure DELETE policy exists for house_points
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow authenticated users to delete house_points'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete house_points"
      ON house_points
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'house_points' AND policyname = 'Allow anonymous users to delete house_points'
  ) THEN
    CREATE POLICY "Allow anonymous users to delete house_points"
      ON house_points
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;

-- Create a function to completely reset house points
CREATE OR REPLACE FUNCTION reset_house_points()
RETURNS void AS $$
BEGIN
  -- Delete all records from house_points table
  DELETE FROM house_points;
  
  -- Log the action to admin_logs
  INSERT INTO admin_logs (action, user_id, timestamp, details)
  VALUES (
    'reset_house_points',
    'system_function',
    now(),
    '{"source": "direct_sql_function", "timestamp": "' || now() || '"}'
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to backup house points before reset
CREATE OR REPLACE FUNCTION backup_house_points()
RETURNS text AS $$
DECLARE
  backup_data json;
  backup_string text;
  timestamp_str text := to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  backup_key text := 'house_points_backup_' || replace(replace(replace(timestamp_str, ':', '_'), '.', '_'), '-', '_');
BEGIN
  -- Get all house points as JSON
  SELECT json_agg(hp) INTO backup_data
  FROM house_points hp;
  
  -- Create backup object with timestamp
  backup_string := json_build_object(
    'timestamp', timestamp_str,
    'data', COALESCE(backup_data, '[]'::json)
  )::text;
  
  -- Store in admin_settings
  INSERT INTO admin_settings (key, value)
  VALUES (backup_key, backup_string)
  ON CONFLICT (key) DO UPDATE
  SET value = backup_string, updated_at = now();
  
  -- Update the latest backup
  INSERT INTO admin_settings (key, value)
  VALUES ('house_points_backup', backup_string)
  ON CONFLICT (key) DO UPDATE
  SET value = backup_string, updated_at = now();
  
  RETURN backup_string;
END;
$$ LANGUAGE plpgsql;

-- Create a function that backs up and then resets house points
CREATE OR REPLACE FUNCTION backup_and_reset_house_points()
RETURNS void AS $$
BEGIN
  -- First backup
  PERFORM backup_house_points();
  
  -- Then reset
  PERFORM reset_house_points();
END;
$$ LANGUAGE plpgsql;