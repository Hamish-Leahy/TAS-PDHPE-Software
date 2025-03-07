/*
  # Initial Schema for TAS Cross Country Tracking System

  1. New Tables
    - `runners`
      - `id` (integer, primary key)
      - `student_id` (text, unique)
      - `name` (text)
      - `house` (text)
      - `age_group` (text)
      - `finish_time` (timestamp)
      - `position` (integer)
      - `created_at` (timestamp)
    - `house_points`
      - `id` (integer, primary key)
      - `house` (text)
      - `points` (integer)
      - `created_at` (timestamp)
    - `race_events`
      - `id` (integer, primary key)
      - `name` (text)
      - `date` (date)
      - `status` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write data
*/

-- Create runners table
CREATE TABLE IF NOT EXISTS runners (
  id SERIAL PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  house TEXT NOT NULL,
  age_group TEXT NOT NULL,
  finish_time TIMESTAMPTZ,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create house_points table
CREATE TABLE IF NOT EXISTS house_points (
  id SERIAL PRIMARY KEY,
  house TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create race_events table
CREATE TABLE IF NOT EXISTS race_events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_events ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read runners"
  ON runners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert runners"
  ON runners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update runners"
  ON runners
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read house_points"
  ON house_points
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert house_points"
  ON house_points
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read race_events"
  ON race_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert race_events"
  ON race_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update race_events"
  ON race_events
  FOR UPDATE
  TO authenticated
  USING (true);