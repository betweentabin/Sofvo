-- Missing tables for D1

-- Tournament matches
CREATE TABLE IF NOT EXISTS tournament_matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  match_number INTEGER,
  round TEXT,
  team1_id TEXT,
  team2_id TEXT,
  player1_id TEXT,
  player2_id TEXT,
  score1 INTEGER,
  score2 INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  scheduled_time TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (player1_id) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (player2_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  platform TEXT,
  device_info TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Activities feed
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Notification settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  push_enabled INTEGER DEFAULT 1,
  email_enabled INTEGER DEFAULT 1,
  tournament_updates INTEGER DEFAULT 1,
  team_updates INTEGER DEFAULT 1,
  message_updates INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
