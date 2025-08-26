# Sofvo Backend API

## 概要
Sofvoアプリケーションのバックエンドサービス。スポーツ・競技関連のソーシャルプラットフォームのAPIを提供します。

## 技術スタック
- Node.js + Express.js
- PostgreSQL / MongoDB (データベース)
- JWT認証
- RESTful API

## 主要機能

### 1. 認証・ユーザー管理
- ユーザー登録
- ログイン/ログアウト
- プロフィール管理
- パスワードリセット
- 退会処理

### 2. チーム管理
- チーム作成・編集・削除
- メンバー管理（招待、削除、権限管理）
- チームプロフィール管理

### 3. 大会管理
- 大会作成・編集・削除
- 大会募集・参加管理
- 大会結果管理
- 大会検索・フィルタリング

### 4. ソーシャル機能
- DM（ダイレクトメッセージ）
- お知らせ・通知
- おすすめ機能

### 5. その他
- お問い合わせ
- 画像アップロード
- 設定管理

## APIエンドポイント設計

### 認証 `/api/auth`
- `POST /register` - 新規ユーザー登録
- `POST /login` - ログイン
- `POST /logout` - ログアウト
- `POST /refresh` - トークンリフレッシュ
- `POST /reset-password` - パスワードリセット
- `DELETE /withdraw` - 退会

### ユーザー `/api/users`
- `GET /me` - 現在のユーザー情報取得
- `GET /:id` - ユーザー情報取得
- `PUT /me` - プロフィール更新
- `PUT /me/settings` - 設定更新
- `PUT /me/notification-settings` - 通知設定更新
- `GET /recommended` - おすすめユーザー取得

### チーム `/api/teams`
- `GET /` - チーム一覧取得
- `POST /` - チーム作成
- `GET /:id` - チーム詳細取得
- `PUT /:id` - チーム情報更新
- `DELETE /:id` - チーム削除
- `POST /:id/members` - メンバー追加
- `DELETE /:id/members/:userId` - メンバー削除
- `PUT /:id/members/:userId` - メンバー権限更新
- `GET /my-teams` - 所属チーム一覧

### 大会 `/api/tournaments`
- `GET /` - 大会一覧取得
- `POST /` - 大会作成
- `GET /:id` - 大会詳細取得
- `PUT /:id` - 大会情報更新
- `DELETE /:id` - 大会削除
- `POST /:id/participants` - 大会参加申請
- `GET /:id/participants` - 参加者一覧取得
- `POST /:id/results` - 結果登録
- `GET /:id/results` - 結果取得
- `GET /search` - 大会検索
- `GET /upcoming` - 開催予定大会
- `GET /my-tournaments` - 参加予定・主催大会

### メッセージ `/api/messages`
- `GET /conversations` - 会話一覧取得
- `GET /conversations/:userId` - 特定ユーザーとの会話取得
- `POST /send` - メッセージ送信
- `PUT /:id/read` - 既読にする

### 通知 `/api/notifications`
- `GET /` - 通知一覧取得
- `PUT /:id/read` - 既読にする
- `PUT /read-all` - 全て既読にする
- `DELETE /:id` - 通知削除

### お問い合わせ `/api/contact`
- `POST /` - お問い合わせ送信
- `GET /` - お問い合わせ履歴取得（管理者のみ）

### メディア `/api/media`
- `POST /upload` - 画像アップロード
- `DELETE /:id` - 画像削除

## データベース設計

### Users Table
- id (UUID)
- email
- password_hash
- username
- display_name
- profile_image_url
- bio
- sport_type
- created_at
- updated_at
- deleted_at

### Teams Table
- id (UUID)
- name
- description
- sport_type
- logo_url
- owner_id (User)
- created_at
- updated_at

### TeamMembers Table
- team_id
- user_id
- role (owner/admin/member)
- joined_at

### Tournaments Table
- id (UUID)
- name
- description
- sport_type
- start_date
- end_date
- location
- max_participants
- entry_fee
- organizer_id (User)
- status (draft/recruiting/ongoing/finished)
- created_at
- updated_at

### TournamentParticipants Table
- tournament_id
- team_id/user_id
- status (pending/accepted/rejected)
- registered_at

### Messages Table
- id (UUID)
- sender_id
- receiver_id
- content
- is_read
- created_at

### Notifications Table
- id (UUID)
- user_id
- type
- title
- content
- is_read
- created_at

## セキュリティ要件
- JWT認証の実装
- パスワードのbcryptハッシュ化
- CORS設定
- Rate Limiting
- Input Validation
- SQLインジェクション対策
- XSS対策

## 開発環境セットアップ
```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env

# データベースマイグレーション
npm run migrate

# 開発サーバー起動
npm run dev
```

## デプロイメント
- Heroku / AWS / Google Cloud Platform
- PostgreSQL / MongoDB Atlas
- Redis (セッション管理)
- S3 / Cloudinary (画像ストレージ)