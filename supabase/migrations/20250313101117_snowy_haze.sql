/*
  # Clean up separate junior tables
  
  1. Changes
    - Drop junior-specific tables since we're integrating into main tables
*/

DROP TABLE IF EXISTS junior_house_points CASCADE;
DROP TABLE IF EXISTS junior_results CASCADE;
DROP TABLE IF EXISTS junior_runners CASCADE;
DROP TABLE IF EXISTS junior_races CASCADE;