# Supabase セットアップガイド

## 概要
このプロジェクトではSupabaseを使用してリアルタイムチャット機能、認証、データベース管理を実装しています。

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスし、アカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下の情報を取得：
   - Project URL
   - Anon Key

### 2. 環境変数の設定

`.env.local`ファイルに以下の情報を設定：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. データベーススキーマの適用

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase/schema.sql`の内容をコピーして実行
3. 以下のテーブルが作成されることを確認：
   - profiles（ユーザープロファイル）
   - teams（チーム）
   - team_members（チームメンバー）
   - conversations（会話）
   - conversation_participants（会話参加者）
   - messages（メッセージ）
   - tournaments（大会）
   - tournament_participants（大会参加者）
   - tournament_results（大会結果）
   - notifications（通知）
   - posts（ホームタイムライン用の簡易投稿）

### 4. 認証設定

Supabaseダッシュボードの「Authentication」から：

1. Email認証を有効化
2. 必要に応じてソーシャルログインプロバイダーを設定
3. メール確認を必須にする場合は設定を変更

### 5. リアルタイム設定

Supabaseダッシュボードの「Database」→「Replication」から：

1. 以下のテーブルのリアルタイム機能を有効化：
   - messages
   - notifications
   - conversation_participants
   - posts（新着投稿をホーム画面へ即時反映させるため）

## プロジェクト構造

### Supabase関連ファイル

- `/src/lib/supabase.js` - Supabaseクライアントの初期化
- `/src/contexts/AuthContext.jsx` - 認証コンテキストとフック
- `/src/hooks/useChat.js` - チャット機能用のカスタムフック
- `/src/components/Chat/` - チャットUIコンポーネント
  - `ChatRoom.jsx` - チャットルーム
  - `ChatMessage.jsx` - メッセージコンポーネント

## 主要機能

### 認証機能

```javascript
import { useAuth } from './contexts/AuthContext'

const { user, signIn, signUp, signOut } = useAuth()
```

### チャット機能

```javascript
import { useChat } from './hooks/useChat'

const { messages, sendMessage } = useChat(conversationId)
```

### リアルタイム同期

メッセージはSupabaseのリアルタイム機能により自動的に同期されます。

## 開発時の注意事項

1. **CORS設定**: ローカル開発時はSupabaseのCORS設定を確認
2. **RLS（Row Level Security）**: 本番環境では適切なRLSポリシーを設定
3. **環境変数**: `.env.local`ファイルはGitにコミットしない
4. **データベースマイグレーション**: スキーマ変更時は`schema.sql`を更新

## トラブルシューティング

### よくある問題

1. **認証エラー**
   - 環境変数が正しく設定されているか確認
   - Supabaseプロジェクトの認証設定を確認

2. **リアルタイム同期が動作しない**
   - Replication設定を確認
   - WebSocket接続が確立されているか確認

3. **データベースエラー**
   - RLSポリシーが適切に設定されているか確認
   - ユーザーの権限を確認

## 本番環境へのデプロイ

1. 環境変数を本番環境に設定
2. データベーススキーマを本番環境に適用
3. RLSポリシーを本番用に調整
4. バックアップとモニタリングを設定

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
