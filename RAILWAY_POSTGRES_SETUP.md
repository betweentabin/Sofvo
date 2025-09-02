# Railway PostgreSQL セットアップ手順

## 前準備

### 1. Railway ダッシュボードから接続情報を取得

1. [Railway Dashboard](https://railway.app/dashboard) にログイン
2. PostgreSQLサービスをクリック
3. 「Connect」タブを選択
4. 「Public Network」セクションから以下をコピー：
   - `DATABASE_PUBLIC_URL` (外部接続用URL)

## 方法1: Railway CLI を使用（推奨）

### Railway CLIのインストール

```bash
# macOS
brew install railway

# または npm
npm install -g @railway/cli
```

### Railway CLIでデータベース接続

```bash
# ログイン
railway login

# プロジェクトにリンク
railway link

# PostgreSQL に接続
railway connect postgres

# これで psql プロンプトが開きます
```

## 方法2: ローカルから直接実行

### 1. .env ファイルの設定

```bash
# .env ファイルを作成
cp .env.example .env
```

`.env` を編集して Railway の接続情報を設定：

```env
# Railway Dashboard から取得した Public URL を設定
DATABASE_URL_EXTERNAL=postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@viaduct.proxy.rlwy.net:12345/railway
```

### 2. Node.js スクリプトで実行

```bash
# 依存パッケージのインストール
npm install

# データベースセットアップ（全テーブル作成）
npm run db:setup

# 接続テスト
npm run db:test

# サンプルデータ投入（オプション）
npm run db:seed
```

## 方法3: psql コマンドで直接実行

### psql がインストールされている場合

```bash
# PostgreSQL クライアントのインストール（未インストールの場合）
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### データベースに接続

```bash
# Railway の External URL を使用
psql "postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@viaduct.proxy.rlwy.net:12345/railway"
```

### SQLファイルを実行

```bash
# 基本テーブルの作成
psql "postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@viaduct.proxy.rlwy.net:12345/railway" < database/railway-setup.sql

# 追加テーブルの作成
psql "postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@viaduct.proxy.rlwy.net:12345/railway" < database/additional-tables.sql
```

## 方法4: Railway Dashboard から SQL実行

1. Railway Dashboard にログイン
2. PostgreSQL サービスを選択
3. 「Data」タブをクリック
4. 「Query」セクションで SQL を実行

### 実行する SQL（順番に実行）

```sql
-- 1. 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. その後、database/railway-setup.sql の内容をコピー＆ペースト

-- 3. 次に database/additional-tables.sql の内容をコピー＆ペースト
```

## 推奨手順（最も簡単）

### ステップ 1: 環境変数設定

```bash
# .env ファイルに Railway の External URL を設定
echo 'DATABASE_URL_EXTERNAL=postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@viaduct.proxy.rlwy.net:12345/railway' > .env
```

### ステップ 2: 自動セットアップ実行

```bash
# 全てを一度に実行
npm run db:setup && npm run db:test && npm run db:seed
```

## 確認方法

### 作成されたテーブルを確認

```bash
npm run db:test
```

期待される出力：
```
✅ Connection successful!

📊 Database Information:
   Database: railway
   User: postgres
   Size: XX MB
   Version: PostgreSQL 15.x

📋 Tables: 29

🔍 Checking key tables:
   ✅ users
   ✅ profiles
   ✅ teams
   ✅ tournaments
   ✅ follows
```

### psql で確認

```sql
-- テーブル一覧
\dt

-- テーブル数の確認
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';

-- 特定テーブルの構造確認
\d users
\d posts
\d tournaments
```

## トラブルシューティング

### 「connection refused」エラー

```bash
# External URL が正しいか確認
echo $DATABASE_URL_EXTERNAL

# Railway Dashboard で Public Networking が有効か確認
```

### 「permission denied」エラー

```bash
# ユーザー権限を確認
psql $DATABASE_URL_EXTERNAL -c "\du"
```

### テーブルが作成されない

```bash
# エラーログを確認しながら実行
node database/setup-railway-db.js
```

## データ削除（リセット）

```sql
-- 全テーブル削除（注意！）
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- その後、再度セットアップ
npm run db:setup
```

## 最短手順まとめ

```bash
# 1. .env設定（Railway DashboardからExternal URLをコピー）
echo 'DATABASE_URL_EXTERNAL=[あなたのURL]' > .env

# 2. 実行
npm install
npm run db:setup
npm run db:test
npm run db:seed

# 完了！
```

## 実行後の確認項目

- [ ] 29個のテーブルが作成されている
- [ ] テストユーザーでログインできる（seed実行後）
- [ ] フォロー関係が機能している
- [ ] 投稿が作成できる
- [ ] 大会が作成できる

これで Railway PostgreSQL のセットアップは完了です！