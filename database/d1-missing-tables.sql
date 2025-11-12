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

-- User reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT,
  reported_type TEXT NOT NULL CHECK (reported_type IN ('user', 'post', 'comment', 'team', 'tournament')),
  reported_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'fake', 'violence', 'hate_speech', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  action_taken TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- User blocks
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'message', 'tournament', 'team', 'system')),
  title TEXT NOT NULL,
  content TEXT,
  related_type TEXT,
  related_id TEXT,
  actor_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id, reported_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
