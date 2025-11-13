-- Add missing profile fields to profiles table

-- Add age field
ALTER TABLE profiles ADD COLUMN age INTEGER;

-- Add gender field
ALTER TABLE profiles ADD COLUMN gender TEXT;

-- Add experience_years field
ALTER TABLE profiles ADD COLUMN experience_years TEXT;

-- Add team_name field
ALTER TABLE profiles ADD COLUMN team_name TEXT;

-- Add location field
ALTER TABLE profiles ADD COLUMN location TEXT;

-- Add privacy_settings field (JSON as TEXT in SQLite)
ALTER TABLE profiles ADD COLUMN privacy_settings TEXT;
