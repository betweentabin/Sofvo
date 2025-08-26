-- Sofvo Database Initialization Script
-- このスクリプトをSupabaseのSQL Editorで実行してください

-- ================================================
-- 1. プロファイルテーブル（既存のSupabaseスキーマを拡張）
-- ================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS sport_type TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "push": true, "dm": true, "team_updates": true, "tournament_updates": true}'::jsonb,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- ================================================
-- 2. お問い合わせテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'bug', 'feature', 'account', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. メディアテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  type TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 4. インデックスの作成
-- ================================================

-- プロファイル検索用
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_sport_type ON public.profiles(sport_type);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

-- チーム検索用
CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_sport_type ON public.teams(sport_type);
CREATE INDEX IF NOT EXISTS idx_team_members_user_team ON public.team_members(user_id, team_id);

-- 大会検索用
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport_type ON public.tournaments(sport_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);

-- メッセージ検索用
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);

-- 通知検索用
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- お問い合わせ検索用
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_user ON public.contact_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);

-- メディア検索用
CREATE INDEX IF NOT EXISTS idx_media_user ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media(entity_type, entity_id);

-- ================================================
-- 5. Row Level Security (RLS) ポリシー
-- ================================================

-- Contact Inquiries RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inquiries" ON public.contact_inquiries
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create inquiries" ON public.contact_inquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update inquiries" ON public.contact_inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Media RLS
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media" ON public.media
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload media" ON public.media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media" ON public.media
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 6. 関数とトリガー
-- ================================================

-- プロファイル自動作成（既存の場合はスキップ）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーが存在しない場合のみ作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- タイムスタンプ更新関数（既存の場合はスキップ）
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルのupdated_atトリガー（存在しない場合のみ作成）
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['profiles', 'teams', 'conversations', 'tournaments'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_' || t || '_updated_at'
    ) THEN
      EXECUTE format('
        CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON public.%s
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END
$$;

-- ================================================
-- 7. ストアドプロシージャ
-- ================================================

-- チームメンバー数を取得
CREATE OR REPLACE FUNCTION public.get_team_member_count(team_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.team_members
  WHERE team_id = team_uuid;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- 大会参加者数を取得
CREATE OR REPLACE FUNCTION public.get_tournament_participant_count(tournament_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.tournament_participants
  WHERE tournament_id = tournament_uuid
  AND status = 'registered';
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- ユーザーの未読メッセージ数を取得
CREATE OR REPLACE FUNCTION public.get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER := 0;
  conv RECORD;
BEGIN
  FOR conv IN 
    SELECT conversation_id, last_read_at
    FROM public.conversation_participants
    WHERE user_id = user_uuid
  LOOP
    total_count := total_count + (
      SELECT COUNT(*)
      FROM public.messages
      WHERE conversation_id = conv.conversation_id
      AND sender_id != user_uuid
      AND created_at > COALESCE(conv.last_read_at, '1970-01-01'::timestamptz)
    );
  END LOOP;
  RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. ビューの作成（オプション）
-- ================================================

-- アクティブなユーザービュー
CREATE OR REPLACE VIEW public.active_users AS
SELECT * FROM public.profiles
WHERE deleted_at IS NULL;

-- 開催予定の大会ビュー
CREATE OR REPLACE VIEW public.upcoming_tournaments AS
SELECT * FROM public.tournaments
WHERE status = 'upcoming'
AND start_date > CURRENT_DATE;

-- チーム統計ビュー
CREATE OR REPLACE VIEW public.team_stats AS
SELECT 
  t.id,
  t.name,
  t.sport_type,
  COUNT(DISTINCT tm.user_id) as member_count,
  COUNT(DISTINCT tp.tournament_id) as tournament_count
FROM public.teams t
LEFT JOIN public.team_members tm ON t.id = tm.team_id
LEFT JOIN public.tournament_participants tp ON t.id = tp.team_id
GROUP BY t.id, t.name, t.sport_type;

-- ================================================
-- 9. デフォルトデータ（開発用）
-- ================================================

-- 開発環境の場合のみ実行
DO $$
BEGIN
  -- 開発用の管理者ユーザーが存在しない場合
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) THEN
    -- Note: 実際の管理者ユーザーは Supabase Dashboard から作成し、
    -- そのユーザーIDでプロファイルのroleを'admin'に更新してください
    RAISE NOTICE 'Admin user needs to be created manually through Supabase Auth';
  END IF;
END
$$;

-- ================================================
-- 10. 権限の付与
-- ================================================

-- authenticated ユーザーに必要な権限を付与
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- anon ユーザーに読み取り権限を付与（公開情報のみ）
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.teams, public.tournaments, public.profiles TO anon;

-- ================================================
-- 完了メッセージ
-- ================================================
DO $$
BEGIN
  RAISE NOTICE 'Database initialization completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update .env file with Supabase credentials';
  RAISE NOTICE '2. Create admin user through Supabase Dashboard';
  RAISE NOTICE '3. Test API endpoints';
END
$$;