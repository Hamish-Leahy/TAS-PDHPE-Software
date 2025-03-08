/*
  # Add Swimming Platform Status

  1. Changes
    - Insert initial platform status record for swimming platform
    - Set initial status as active with default message

  2. Security
    - No changes to security policies required
    - Uses existing platform_status table
*/

-- Insert swimming platform status if it doesn't exist
INSERT INTO platform_status (platform, status, message, updated_by)
SELECT 'swimming', 'active', 'System operational', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM platform_status WHERE platform = 'swimming'
);