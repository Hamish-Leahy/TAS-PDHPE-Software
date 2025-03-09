/*
  # Update house enum values
  
  Updates the valid_house constraint to use the correct spelling of Tyrrell
*/

ALTER TABLE students 
DROP CONSTRAINT IF EXISTS valid_house;

ALTER TABLE students
ADD CONSTRAINT valid_house CHECK (
  house = ANY (ARRAY['Broughton'::text, 'Abbott'::text, 'Croft'::text, 'Tyrrell'::text, 'Green'::text, 'Ross'::text])
);