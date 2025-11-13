-- チームメンバーを追加するSQLスクリプト
-- 使い方: wrangler d1 execute sofvo-db --file=database/d1-add-team-members.sql --env production

-- 最新のチームを取得（手動でチームIDを確認する必要があります）
-- SELECT t.id, t.name, tm.user_id as owner_id
-- FROM teams t
-- JOIN team_members tm ON t.id = tm.team_id
-- WHERE tm.role = 'owner'
-- ORDER BY t.created_at DESC
-- LIMIT 1;

-- 既存のメンバーを確認
-- SELECT tm.user_id, p.username, p.display_name, tm.role
-- FROM team_members tm
-- LEFT JOIN profiles p ON tm.user_id = p.id
-- WHERE tm.team_id = 'YOUR_TEAM_ID';

-- 利用可能なユーザーを確認
SELECT id, username, display_name, age, gender, experience_years, location
FROM profiles
LIMIT 10;

-- メンバーを追加する例（実際のIDに置き換えてください）
-- 注意: 以下のINSERT文のIDは例です。実際のチームIDとユーザーIDに置き換えてください

-- INSERT INTO team_members (id, team_id, user_id, role, joined_at)
-- VALUES
--   ('member-id-1', 'YOUR_TEAM_ID', 'USER_ID_1', 'member', datetime('now')),
--   ('member-id-2', 'YOUR_TEAM_ID', 'USER_ID_2', 'member', datetime('now')),
--   ('member-id-3', 'YOUR_TEAM_ID', 'USER_ID_3', 'member', datetime('now'));

-- メンバー追加後の確認
-- SELECT tm.user_id, p.username, p.display_name, p.age, p.gender, p.location, tm.role
-- FROM team_members tm
-- LEFT JOIN profiles p ON tm.user_id = p.id
-- WHERE tm.team_id = 'YOUR_TEAM_ID'
-- ORDER BY
--   CASE tm.role
--     WHEN 'owner' THEN 1
--     WHEN 'admin' THEN 2
--     ELSE 3
--   END,
--   tm.joined_at ASC;
