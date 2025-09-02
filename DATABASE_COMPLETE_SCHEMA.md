# Sofvo完全データベーススキーマ

## 概要
Sofvoアプリケーションの完全なデータベース構造です。Railway PostgreSQLで動作します。

## テーブル一覧（全29テーブル）

### 🔐 認証・ユーザー管理
| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **users** | ユーザーアカウント | email, encrypted_password, email_confirmed_at |
| **profiles** | プロフィール情報 | username, display_name, bio, sport_type, followers_count |
| **follows** | フォロー関係 | follower_id, following_id |
| **notification_settings** | 通知設定 | 各種通知のON/OFF設定 |
| **device_tokens** | プッシュ通知トークン | token, platform (ios/android/web) |

### 🏐 チーム管理
| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **teams** | チーム情報 | name, description, sport_type, created_by |
| **team_members** | チームメンバー | team_id, user_id, role (owner/admin/member) |

### 🏆 大会管理
| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **tournaments** | 大会基本情報 | name, location, start_date, status |
| **tournament_categories** | 大会カテゴリ・部門 | name (男子/女子/ミックス等), skill_level |
| **tournament_recruitments** | 募集詳細 | recruitment_type, participation_fee, requirements |
| **tournament_applications** | 応募管理 | applicant_user_id/team_id, status, message |
| **tournament_participants** | 参加者 | tournament_id, team_id/user_id, status |
| **tournament_matches** | 試合情報 | round_number, court_number, score, winner_id |
| **tournament_results** | 大会結果 | position, points, notes |
| **tournament_announcements** | 大会お知らせ | title, content, type (info/urgent等) |

### 📝 投稿・コンテンツ
| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **posts** | 投稿・日記 | content, type (post/diary/announcement), visibility |
| **post_images** | 投稿画像 | post_id, image_url, caption |
| **comments** | コメント | post_id, user_id, content, parent_comment_id |
| **post_likes** | 投稿いいね | post_id, user_id |
| **likes** | 汎用いいね | target_type, target_id, user_id |

### 💬 メッセージング
| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **conversations** | 会話 | type (direct/group/team), name |
| **conversation_participants** | 会話参加者 | conversation_id, user_id, last_read_at |
| **messages** | メッセージ | conversation_id, sender_id, content, type |

### 📊 アクティビティ・統計
| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **activities** | アクティビティフィード | user_id, type, target_type, target_id |
| **notifications** | 通知 | user_id, type, title, message, read |
| **user_achievements** | 実績 | user_id, achievement_type, points |
| **point_transactions** | ポイント履歴 | user_id, points, type, description |

### 🛡️ モデレーション
| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **reports** | 通報 | reporter_id, reported_type, reason, status |

## 主要な機能とテーブルの関係

### 1. 投稿機能
```
posts → post_images (1:N)
      → comments (1:N) → comments (自己参照：返信)
      → post_likes (1:N)
```

### 2. 大会募集・運営
```
tournaments → tournament_categories (1:N)
            → tournament_recruitments (1:1)
            → tournament_applications (1:N)
            → tournament_participants (1:N)
            → tournament_matches (1:N)
            → tournament_results (1:N)
            → tournament_announcements (1:N)
```

### 3. チャット機能
```
conversations → conversation_participants (1:N)
              → messages (1:N)
```

### 4. フォロー・タイムライン
```
users → follows (follower/following)
      → posts → activities (タイムライン生成)
```

## インデックス（パフォーマンス最適化）
- 全外部キーにインデックス
- 頻繁に検索される列（username, email, status等）
- 時系列データ（created_at DESC）
- 複合インデックス（user_id + created_at等）

## トリガー
1. **updated_at自動更新** - 全テーブル
2. **フォロー数カウント** - follows → profiles
3. **投稿いいね数更新** - post_likes → posts
4. **アクティビティ作成** - posts → activities

## ビュー（集計用）
- **user_stats** - ユーザー統計
- **team_stats** - チーム統計  
- **post_stats** - 投稿統計
- **tournament_recruitment_status** - 募集状況
- **user_activity_summary** - ユーザーアクティビティサマリー

## セキュリティ考慮事項
1. **UUID使用** - 推測困難なID
2. **外部キー制約** - データ整合性
3. **CHECK制約** - データ検証
4. **CASCADE DELETE** - 関連データの自動削除

## 拡張予定
- [ ] ブロック機能（blocked_users）
- [ ] タグ機能（tags, post_tags）
- [ ] ランキング機能（rankings）
- [ ] 決済機能（payments, transactions）
- [ ] 動画投稿（post_videos）

## セットアップコマンド
```bash
# 全テーブル作成
npm run db:setup

# 追加テーブルのみ作成
psql $DATABASE_URL < database/additional-tables.sql

# 確認
npm run db:test
```

## 注意事項
- Supabaseから移行する場合、auth.usersの代わりにusersテーブルを使用
- RLSポリシーの代わりにアプリケーション層でアクセス制御を実装
- リアルタイム機能はWebSocketやSSEで別途実装が必要