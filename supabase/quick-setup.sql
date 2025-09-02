-- 🚀 Sofvo用の最小限スキーマ（手動実行用）

-- 1. profilesテーブル作成
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  sport_type TEXT,
  location TEXT,
  age INTEGER,
  gender TEXT,
  experience_years TEXT,
  team_name TEXT,
  privacy_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLSポリシー作成
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. 新規ユーザー自動プロフィール作成関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 既存のトリガーを削除してから新しく作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 既存ユーザーのプロフィール作成（一旦削除してから作成）
DELETE FROM public.profiles;

-- テストユーザーのプロフィール作成
INSERT INTO public.profiles (id, username, display_name, bio, sport_type, location)
SELECT 
  id,
  CASE email
    WHEN 'test@sofvo.com' THEN 'testuser'
    WHEN 'player1@sofvo.com' THEN 'yamada'
    WHEN 'coach@sofvo.com' THEN 'tanaka'
    WHEN 'organizer@sofvo.com' THEN 'organizer'
    ELSE replace(replace(email, '@', '_'), '.', '_')
  END as username,
  CASE email
    WHEN 'test@sofvo.com' THEN 'テストユーザー'
    WHEN 'player1@sofvo.com' THEN '山田太郎'
    WHEN 'coach@sofvo.com' THEN '田中コーチ'
    WHEN 'organizer@sofvo.com' THEN '大会運営者'
    ELSE split_part(email, '@', 1)
  END as display_name,
  CASE email
    WHEN 'test@sofvo.com' THEN 'Sofvoのテストアカウントです。アプリの動作確認にご利用ください。'
    WHEN 'player1@sofvo.com' THEN 'ソフトテニス歴5年、週末プレーヤーです。大会参加が趣味です！'
    WHEN 'coach@sofvo.com' THEN '指導歴10年のコーチです。選手育成に情熱を注いでいます。'
    WHEN 'organizer@sofvo.com' THEN '各地で大会を運営しています。皆さんの参加をお待ちしています！'
    ELSE 'よろしくお願いします'
  END as bio,
  'ソフトテニス' as sport_type,
  CASE email
    WHEN 'test@sofvo.com' THEN '東京都'
    WHEN 'player1@sofvo.com' THEN '神奈川県'
    WHEN 'coach@sofvo.com' THEN '埼玉県'
    WHEN 'organizer@sofvo.com' THEN '千葉県'
    ELSE '日本'
  END as location
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  sport_type = EXCLUDED.sport_type,
  location = EXCLUDED.location,
  updated_at = NOW();

-- 7. 結果確認
SELECT 
  p.display_name,
  p.username,
  p.bio,
  p.location,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY u.created_at;
