# Railway PostgreSQL セットアップガイド

## 概要
このガイドでは、Railway PostgreSQLをSofvoアプリケーションで使用するための設定手順を説明します。

## 前提条件
- Railway アカウント
- Node.js v16以上
- npm または yarn

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
# または
npm install pg dotenv
```

### 2. 環境変数の設定

`.env`ファイルを作成し、Railway PostgreSQLの接続情報を設定します。

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
# Railway内部接続（Railway上でのデプロイ時）
DATABASE_URL=postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@postgres.railway.internal:5432/railway

# 外部接続（ローカル開発時）
# RailwayダッシュボードのPostgreSQL → Connect → Public Networkから取得
DATABASE_URL_EXTERNAL=postgresql://postgres:[PASSWORD]@[HOST].railway.app:[PORT]/railway
```

**重要**: 
- ローカル開発時は`DATABASE_URL_EXTERNAL`を使用
- Railwayダッシュボードから外部接続URLを取得してください

### 3. データベースのセットアップ

#### 3.1 データベーススキーマの作成

```bash
npm run db:setup
```

このコマンドで以下が作成されます：
- テーブル（users, profiles, teams, tournaments など）
- インデックス
- トリガー
- ビュー

#### 3.2 接続テスト

```bash
npm run db:test
```

接続が成功すると、データベース情報とテーブル一覧が表示されます。

#### 3.3 サンプルデータの投入（オプション）

```bash
npm run db:seed
```

テスト用アカウント：
- Email: `taro@example.com` / Password: `password123`
- Email: `hanako@example.com` / Password: `password123`
- Email: `ichiro@example.com` / Password: `password123`

#### 3.4 データベースのリセット（開発時）

```bash
npm run db:reset
```

スキーマの再作成とサンプルデータの投入を同時に行います。

## データベース構造

### 主要テーブル

| テーブル名 | 説明 |
|-----------|------|
| users | ユーザーアカウント情報 |
| profiles | ユーザープロフィール |
| follows | フォロー関係 |
| teams | チーム情報 |
| team_members | チームメンバー |
| tournaments | 大会情報 |
| tournament_participants | 大会参加者 |
| tournament_results | 大会結果 |
| conversations | 会話（DM、グループチャット） |
| messages | メッセージ |
| notifications | 通知 |
| likes | いいね |
| device_tokens | プッシュ通知用トークン |

### 特徴

1. **UUID主キー**: 全テーブルでUUIDを使用
2. **外部キー制約**: データ整合性を保証
3. **インデックス**: パフォーマンス最適化
4. **トリガー**: 
   - updated_at自動更新
   - フォロー数の自動カウント
5. **ビュー**:
   - user_stats: ユーザー統計
   - team_stats: チーム統計

## Railwayでのデプロイ

### 1. 環境変数の設定

Railwayダッシュボードで以下の環境変数を設定：

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

### 2. ビルドコマンド

```bash
npm install && npm run build
```

### 3. スタートコマンド

```bash
npm start
```

## トラブルシューティング

### 接続エラー

1. **"connection refused"エラー**
   - 外部URLが正しいか確認
   - Railwayダッシュボードで公開ネットワークが有効か確認

2. **"SSL required"エラー**
   - 接続文字列に`?sslmode=require`を追加

3. **"permission denied"エラー**
   - データベースユーザーの権限を確認

### よくある質問

**Q: ローカルからRailway PostgreSQLに接続できない**
A: DATABASE_URL_EXTERNALに外部接続URLを設定してください

**Q: テーブルが作成されない**
A: `npm run db:setup`を実行し、エラーメッセージを確認してください

**Q: サンプルデータが投入されない**
A: まず`npm run db:setup`でスキーマを作成してから`npm run db:seed`を実行してください

## 次のステップ

1. **APIサーバーの実装**
   - Express.jsでREST APIを作成
   - PostgreSQLとの連携

2. **認証システムの実装**
   - JWTベースの認証
   - Railway PostgreSQLでのセッション管理

3. **リアルタイム機能**
   - WebSocketまたはServer-Sent Events
   - PostgreSQL LISTENを活用

## 参考リンク

- [Railway Documentation](https://docs.railway.app/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL Client](https://node-postgres.com/)

## サポート

問題が発生した場合は、以下を確認してください：
1. このガイドのトラブルシューティングセクション
2. エラーログ（`npm run db:test`の出力）
3. Railway ダッシュボードのログ