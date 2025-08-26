-- テストアカウント用のプロフィールデータを作成/更新
-- test@example.com のユーザーIDを取得して、プロフィールを作成

-- まず既存のプロフィールを削除（もしあれば）
DELETE FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- テストアカウントのプロフィールを作成
INSERT INTO profiles (
    id,
    display_name,
    username,
    age,
    gender,
    experience_years,
    team_name,
    location,
    bio,
    avatar_url,
    privacy_settings,
    created_at,
    updated_at
)
SELECT 
    id,
    '田中 太郎' as display_name,
    'tanaka_taro' as username,
    28 as age,
    'male' as gender,
    '5' as experience_years,
    'チームサンプル' as team_name,
    '東京都' as location,
    'ソフトテニスが大好きです！週末は必ずコートに出ています。全国大会出場を目指して日々練習中です。よろしくお願いします！' as bio,
    null as avatar_url,
    jsonb_build_object(
        'username', 'public',
        'age', 'public',
        'gender', 'public',
        'experience', 'public',
        'team', 'public',
        'location', 'public'
    ) as privacy_settings,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users 
WHERE email = 'test@example.com'
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = EXCLUDED.username,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    experience_years = EXCLUDED.experience_years,
    team_name = EXCLUDED.team_name,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    privacy_settings = EXCLUDED.privacy_settings,
    updated_at = NOW();

-- サンプルの大会参加履歴を追加（オプション）
-- まず、サンプル大会を作成
INSERT INTO tournaments (id, name, start_date, end_date, location, description, created_at)
VALUES 
    ('tourna-001', '春季ソフトテニス大会', '2024-04-15', '2024-04-16', '東京体育館', '春の定期大会', NOW()),
    ('tourna-002', '夏季選手権大会', '2024-07-20', '2024-07-21', '国立競技場', '夏の選手権', NOW()),
    ('tourna-003', '秋季リーグ戦', '2024-10-10', '2024-10-11', '有明テニスの森', '秋季リーグ', NOW())
ON CONFLICT (id) DO NOTHING;

-- 大会参加履歴を追加
WITH user_id AS (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
)
INSERT INTO tournament_participants (user_id, tournament_id, created_at)
SELECT 
    user_id.id,
    tournament_id,
    NOW()
FROM user_id,
    (VALUES ('tourna-001'), ('tourna-002'), ('tourna-003')) AS t(tournament_id)
ON CONFLICT DO NOTHING;

-- 大会結果を追加
WITH user_id AS (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
)
INSERT INTO tournament_results (user_id, tournament_id, position, points, created_at)
SELECT 
    user_id.id,
    tournament_id,
    position,
    points,
    NOW()
FROM user_id,
    (VALUES 
        ('tourna-001', 3, 150),
        ('tourna-002', 1, 300),
        ('tourna-003', 2, 200)
    ) AS t(tournament_id, position, points)
ON CONFLICT DO NOTHING;

-- フォロー・フォロワーのサンプルデータ（他のユーザーが必要な場合）
-- このクエリは他のユーザーが存在する場合にのみ実行してください

-- 結果を確認
SELECT 
    p.*,
    (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.user_id = p.id) as tournament_count,
    (SELECT SUM(points) FROM tournament_results tr WHERE tr.user_id = p.id) as total_points
FROM profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'test@example.com');