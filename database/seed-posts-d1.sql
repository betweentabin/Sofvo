-- Seed posts for users (3 posts per user)
-- Run with: npx wrangler d1 execute sofvo-db --remote --file=./database/seed-posts-d1.sql

-- sofvo_official
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-official-1', '00000000-0000-0000-0000-000000000000', 'Sofvoへようこそ！みんなでスポーツを楽しみましょう 🎉', 'public', 25, 0, datetime('now'), datetime('now')),
  ('post-official-2', '00000000-0000-0000-0000-000000000000', '新しい機能を追加しました。活動記録を確認してみてください！', 'public', 18, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-official-3', '00000000-0000-0000-0000-000000000000', 'コミュニティのみなさん、いつもありがとうございます 💪', 'public', 32, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- test
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-test-1', 'fe459640-6c6a-4a02-8071-1d2069e8d186', '今日の練習は充実していました！新しい技を習得できて嬉しいです 💪', 'public', 12, 0, datetime('now'), datetime('now')),
  ('post-test-2', 'fe459640-6c6a-4a02-8071-1d2069e8d186', 'チームメイトと一緒にトレーニング。みんなで成長できることが何より楽しい！', 'public', 8, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-test-3', 'fe459640-6c6a-4a02-8071-1d2069e8d186', '大会に向けて準備中。目標に向かって頑張ります！', 'public', 15, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- codex_1760231445
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-codex-1', 'ecfc8bef-5159-4797-8d5f-c474302472ca', '今週末の試合が楽しみです。ベストを尽くします！', 'public', 10, 0, datetime('now'), datetime('now')),
  ('post-codex-2', 'ecfc8bef-5159-4797-8d5f-c474302472ca', '新しい戦術を試してみました。なかなか良い感じです👍', 'public', 7, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-codex-3', 'ecfc8bef-5159-4797-8d5f-c474302472ca', '朝練習からスタート。良い汗をかきました☀️', 'public', 9, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- taro
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-taro-1', 'e6987383-e866-4d1c-9827-90494f74ebbf', 'コーチからアドバイスをもらって改善点が見えてきました', 'public', 11, 0, datetime('now'), datetime('now')),
  ('post-taro-2', 'e6987383-e866-4d1c-9827-90494f74ebbf', '仲間と切磋琢磨できる環境に感謝です', 'public', 6, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-taro-3', 'e6987383-e866-4d1c-9827-90494f74ebbf', '次の目標に向けて計画を立てています📝', 'public', 14, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- hanako
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-hanako-1', '53169f23-024a-42e9-bd10-473648c345c5', '今日の反省点を活かして明日も頑張ります！', 'public', 8, 0, datetime('now'), datetime('now')),
  ('post-hanako-2', '53169f23-024a-42e9-bd10-473648c345c5', '基礎練習の大切さを改めて実感しました', 'public', 5, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-hanako-3', '53169f23-024a-42e9-bd10-473648c345c5', '試合で学んだことをチームで共有しました', 'public', 12, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- ichiro
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-ichiro-1', '3ff53c14-8f52-40d6-911c-e8cfaaf0fc8c', 'メンタルトレーニングも取り入れています🧘', 'public', 13, 0, datetime('now'), datetime('now')),
  ('post-ichiro-2', '3ff53c14-8f52-40d6-911c-e8cfaaf0fc8c', '体調管理も競技の一部。しっかりケアします', 'public', 7, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-ichiro-3', '3ff53c14-8f52-40d6-911c-e8cfaaf0fc8c', '目標達成に向けて一歩ずつ前進中！', 'public', 16, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- yuki
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-yuki-1', 'e9cefaed-c165-4f74-aab3-8a9d3d9052cc', '新しい記録を達成できました！次の目標へ 🎯', 'public', 19, 0, datetime('now'), datetime('now')),
  ('post-yuki-2', 'e9cefaed-c165-4f74-aab3-8a9d3d9052cc', 'トレーニング仲間に恵まれて本当に嬉しい', 'public', 9, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-yuki-3', 'e9cefaed-c165-4f74-aab3-8a9d3d9052cc', '今日も良いコンディションで練習できました', 'public', 11, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- ken
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-ken-1', '24424a60-0332-4c67-8427-9dff4cf96f8f', '週末の大会に向けて最終調整中です', 'public', 10, 0, datetime('now'), datetime('now')),
  ('post-ken-2', '24424a60-0332-4c67-8427-9dff4cf96f8f', 'フォームを見直したら動きが改善されました', 'public', 6, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-ken-3', '24424a60-0332-4c67-8427-9dff4cf96f8f', 'チーム練習で良い雰囲気を感じています', 'public', 8, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- testuser
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-testuser-1', '715e9b98-24a5-4689-aa69-f7e1b3cf5e8b', '新しいトレーニングメニューを導入しました 💪', 'public', 14, 0, datetime('now'), datetime('now')),
  ('post-testuser-2', '715e9b98-24a5-4689-aa69-f7e1b3cf5e8b', '継続は力なり。毎日コツコツ積み重ねています', 'public', 7, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-testuser-3', '715e9b98-24a5-4689-aa69-f7e1b3cf5e8b', '先輩からアドバイスをいただき勉強になりました', 'public', 10, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- cfuser
INSERT OR IGNORE INTO posts (id, user_id, content, visibility, like_count, comment_count, created_at, updated_at)
VALUES
  ('post-cfuser-1', '6ec226bb-1246-4cc2-be77-158931ffc859', 'モチベーション高く練習に取り組んでいます！', 'public', 12, 0, datetime('now'), datetime('now')),
  ('post-cfuser-2', '6ec226bb-1246-4cc2-be77-158931ffc859', '昨日の試合の反省を次に活かします', 'public', 5, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('post-cfuser-3', '6ec226bb-1246-4cc2-be77-158931ffc859', 'チームワークの大切さを実感した一日でした', 'public', 9, 0, datetime('now', '-2 days'), datetime('now', '-2 days'));
