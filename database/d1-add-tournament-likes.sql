-- Add tournament_likes table for tournament like/unlike functionality
CREATE TABLE IF NOT EXISTS tournament_likes (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_likes_tournament ON tournament_likes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_user ON tournament_likes(user_id);
