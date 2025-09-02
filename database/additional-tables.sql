-- ============================================
-- 追加テーブル: 投稿、募集、詳細機能
-- ============================================

-- ============================================
-- 1. 投稿・日記機能
-- ============================================

-- Posts table (投稿・日記)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- チーム投稿の場合
  content TEXT NOT NULL,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'diary', 'announcement', 'result')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'team', 'private')),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL, -- 大会結果投稿の場合
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post images table (投稿画像)
CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table (コメント)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 返信の場合
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes table (投稿へのいいね - 既存のlikesテーブルとは別管理)
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- 2. 大会募集・応募機能
-- ============================================

-- Tournament recruitment details (大会募集詳細)
CREATE TABLE IF NOT EXISTS tournament_recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  recruitment_type TEXT DEFAULT 'team' CHECK (recruitment_type IN ('team', 'individual', 'both')),
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  participation_fee INTEGER DEFAULT 0,
  fee_details TEXT,
  requirements TEXT, -- 参加要件
  benefits TEXT, -- 参加特典
  contact_info TEXT,
  application_method TEXT,
  selection_method TEXT, -- 選考方法（先着順、抽選など）
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id)
);

-- Tournament applications (大会応募)
CREATE TABLE IF NOT EXISTS tournament_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  applicant_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  application_type TEXT CHECK (application_type IN ('individual', 'team')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'waitlist')),
  message TEXT, -- 応募メッセージ
  admin_notes TEXT, -- 管理者メモ
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  CHECK ((applicant_user_id IS NOT NULL AND application_type = 'individual') OR 
         (applicant_team_id IS NOT NULL AND application_type = 'team'))
);

-- Tournament categories/divisions (大会カテゴリ・部門)
CREATE TABLE IF NOT EXISTS tournament_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 例: "男子の部", "女子の部", "ミックス", "初級者"
  description TEXT,
  max_participants INTEGER,
  min_age INTEGER,
  max_age INTEGER,
  gender_restriction TEXT CHECK (gender_restriction IN ('male', 'female', 'mixed', 'none')),
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'open')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 大会進行・試合管理
-- ============================================

-- Tournament matches (試合)
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id UUID REFERENCES tournament_categories(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL, -- ラウンド番号（1=第1回戦, -1=決勝など）
  match_number INTEGER NOT NULL, -- 試合番号
  court_number TEXT, -- コート番号
  scheduled_time TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
  participant1_id UUID REFERENCES tournament_participants(id),
  participant2_id UUID REFERENCES tournament_participants(id),
  winner_id UUID REFERENCES tournament_participants(id),
  score_participant1 TEXT, -- スコア（JSON形式で保存）
  score_participant2 TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament announcements (大会お知らせ)
CREATE TABLE IF NOT EXISTS tournament_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'urgent', 'schedule', 'result', 'cancellation')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. アクティビティフィード
-- ============================================

-- Activity feed (アクティビティフィード)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'post_created', 'post_liked', 'comment_added',
    'tournament_joined', 'tournament_result', 'tournament_created',
    'team_joined', 'team_created',
    'follow_user', 'achievement_earned'
  )),
  target_type TEXT, -- 'post', 'tournament', 'team', 'user' など
  target_id UUID,
  metadata JSONB, -- 追加情報
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 実績・ポイントシステム
-- ============================================

-- User achievements (ユーザー実績)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Point transactions (ポイント履歴)
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- 正の値は獲得、負の値は消費
  type TEXT NOT NULL CHECK (type IN ('tournament_result', 'achievement', 'bonus', 'penalty', 'transfer')),
  description TEXT,
  reference_type TEXT, -- 'tournament', 'achievement' など
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. 通知設定
-- ============================================

-- Notification settings (通知設定)
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  -- 通知タイプごとの設定
  follow_notification BOOLEAN DEFAULT TRUE,
  like_notification BOOLEAN DEFAULT TRUE,
  comment_notification BOOLEAN DEFAULT TRUE,
  mention_notification BOOLEAN DEFAULT TRUE,
  tournament_notification BOOLEAN DEFAULT TRUE,
  team_notification BOOLEAN DEFAULT TRUE,
  message_notification BOOLEAN DEFAULT TRUE,
  announcement_notification BOOLEAN DEFAULT TRUE,
  -- 通知方法
  email_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. レポート・モデレーション
-- ============================================

-- Reports (通報)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_type TEXT NOT NULL CHECK (reported_type IN ('user', 'post', 'comment', 'team', 'tournament')),
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'fake', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. インデックス作成
-- ============================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_team ON posts(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tournament ON posts(tournament_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- Post likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- Tournament recruitment indexes
CREATE INDEX IF NOT EXISTS idx_tournament_applications_tournament ON tournament_applications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_applications_user ON tournament_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_applications_team ON tournament_applications(applicant_team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_applications_status ON tournament_applications(status);

-- Tournament matches indexes
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);

-- ============================================
-- 9. トリガー関数
-- ============================================

-- Post like count trigger
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET updated_at = NOW() WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET updated_at = NOW() WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_like_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Activity feed trigger for posts
CREATE OR REPLACE FUNCTION create_post_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (user_id, type, target_type, target_id)
  VALUES (NEW.user_id, 'post_created', 'post', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_post_activity_trigger
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION create_post_activity();

-- ============================================
-- 10. ビュー作成
-- ============================================

-- Post statistics view
CREATE OR REPLACE VIEW post_stats AS
SELECT 
  p.id,
  p.user_id,
  p.content,
  p.type,
  COUNT(DISTINCT pl.id) as like_count,
  COUNT(DISTINCT c.id) as comment_count,
  p.created_at
FROM posts p
LEFT JOIN post_likes pl ON pl.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, p.user_id, p.content, p.type, p.created_at;

-- Tournament recruitment status view
CREATE OR REPLACE VIEW tournament_recruitment_status AS
SELECT 
  t.id,
  t.name,
  tr.recruitment_type,
  tr.max_participants,
  COUNT(DISTINCT ta.id) as application_count,
  COUNT(DISTINCT CASE WHEN ta.status = 'approved' THEN ta.id END) as approved_count,
  tr.is_active,
  t.registration_deadline
FROM tournaments t
LEFT JOIN tournament_recruitments tr ON tr.tournament_id = t.id
LEFT JOIN tournament_applications ta ON ta.tournament_id = t.id
GROUP BY t.id, t.name, tr.recruitment_type, tr.max_participants, tr.is_active, t.registration_deadline;

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT pl.id) as likes_given,
  COUNT(DISTINCT a.id) as activities_count,
  MAX(a.created_at) as last_activity
FROM profiles u
LEFT JOIN posts p ON p.user_id = u.id
LEFT JOIN comments c ON c.user_id = u.id
LEFT JOIN post_likes pl ON pl.user_id = u.id
LEFT JOIN activities a ON a.user_id = u.id
GROUP BY u.id, u.username;

-- ============================================
-- 完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Additional tables created successfully!';
  RAISE NOTICE 'New tables: posts, post_images, comments, post_likes, tournament_recruitments, tournament_applications, tournament_categories, tournament_matches, tournament_announcements, activities, user_achievements, point_transactions, notification_settings, reports';
  RAISE NOTICE 'Indexes and triggers are set up';
  RAISE NOTICE 'Views created: post_stats, tournament_recruitment_status, user_activity_summary';
END $$;