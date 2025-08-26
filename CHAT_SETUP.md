# チャット機能のセットアップガイド

## 🚀 クイックスタート

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのダッシュボードから以下の情報を取得：
   - Project URL
   - Anon Key

### 2. 環境変数の設定

```bash
# .env.exampleを.envにコピー
cp .env.example .env
```

`.env`ファイルに取得した値を設定：
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. データベースの設定

Supabaseダッシュボードの「SQL Editor」から、`supabase/schema.sql`の内容を実行してテーブルを作成します。

### 4. リアルタイム機能の有効化

Supabaseダッシュボードで以下のテーブルのリアルタイム機能を有効にします：
1. Database → Replication
2. 以下のテーブルを有効化：
   - messages
   - conversations
   - conversation_participants
   - notifications

### 5. アプリケーションの起動

```bash
npm install
npm run dev
```

## 📱 チャット機能の使い方

### メッセージ画面へのアクセス
- ヘッダーのメッセージアイコン（💬）をクリック
- URL: `/dm`

### 新しい会話を開始
1. 「新規作成」ボタンをクリック
2. ユーザー名で検索
3. 送信したいユーザーを選択

### メッセージの送信
1. 会話を選択
2. メッセージ入力欄にテキストを入力
3. Enterキーまたは送信ボタンをクリック

### リアルタイム通知
- 新着メッセージは自動的に表示されます
- リアルタイムでの既読状態の更新

## 🔒 セキュリティ設定

### Row Level Security (RLS)
以下のポリシーが適用されています：
- ユーザーは自分が参加している会話のみ閲覧可能
- メッセージの送信は会話の参加者のみ可能
- プロフィール情報は公開（ユーザー名検索のため）

## 🛠️ トラブルシューティング

### メッセージが送信できない場合
1. Supabaseの認証状態を確認
2. ネットワーク接続を確認
3. コンソールエラーを確認

### リアルタイム更新が動作しない場合
1. Supabaseダッシュボードでリアルタイム機能が有効か確認
2. WebSocket接続がブロックされていないか確認

### ユーザーが検索できない場合
1. profilesテーブルにユーザー情報が存在するか確認
2. RLSポリシーが正しく設定されているか確認

## 📊 データベース構造

### profiles
- ユーザープロフィール情報
- 認証システムと連携

### conversations
- 会話の基本情報
- direct（1対1）またはgroup（グループ）タイプ

### conversation_participants
- 会話の参加者管理
- 既読管理

### messages
- メッセージ本文
- テキスト、画像、ファイルのサポート

## 🔄 今後の拡張予定

- [ ] ファイル・画像送信機能
- [ ] グループチャット作成機能
- [ ] メッセージの編集・削除機能
- [ ] 絵文字リアクション
- [ ] メッセージ検索機能
- [ ] プッシュ通知
- [ ] 音声・ビデオ通話機能

## 📝 開発者向け情報

### 主要コンポーネント
- `/src/screens/DM/Dm.jsx` - メインのチャット画面
- `/src/components/Chat/ChatRoom.jsx` - チャットルームコンポーネント
- `/src/components/Chat/ChatMessage.jsx` - メッセージ表示コンポーネント
- `/src/hooks/useChat.js` - チャット機能のカスタムフック
- `/src/lib/supabase.js` - Supabaseクライアントと関数

### APIリファレンス
主要な関数はすべて `/src/lib/supabase.js` に定義されています：
- `getConversations()` - 会話一覧取得
- `getMessages()` - メッセージ取得
- `sendMessage()` - メッセージ送信
- `createConversation()` - 新規会話作成
- `subscribeToMessages()` - リアルタイムサブスクリプション

## 🤝 サポート

問題が解決しない場合は、以下の情報と共に開発チームに連絡してください：
- エラーメッセージ
- ブラウザコンソールログ
- 実行した操作の手順