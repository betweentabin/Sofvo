-- Add phase column to tournament_matches table
ALTER TABLE tournament_matches ADD COLUMN phase TEXT DEFAULT 'qualifier';

-- Update existing matches to have 'qualifier' phase
UPDATE tournament_matches SET phase = 'qualifier' WHERE phase IS NULL;
