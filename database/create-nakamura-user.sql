-- Create Nakamura user account
-- Generate unique UUID for user
INSERT INTO users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  'a5b6c7d8-9012-34ef-5678-901234567890',
  'nakamura@sofvo.com',
  'nakamura2024',
  datetime('now'),
  datetime('now'),
  datetime('now')
);

-- Insert profile for Nakamura
INSERT INTO profiles (
  id,
  username,
  display_name,
  bio,
  avatar_url,
  sport_type,
  location,
  created_at,
  updated_at
) VALUES (
  'a5b6c7d8-9012-34ef-5678-901234567890',
  'nakamura',
  '中村',
  'スポーツ大好きです！よろしくお願いします。',
  NULL,
  'バレーボール',
  '神奈川県',
  datetime('now'),
  datetime('now')
);
