# Supabase チャット機能開発計画

## 📋 プロジェクト概要
Sofvoアプリケーションに、Supabaseを活用したリアルタイムチャット機能を実装します。

## 🎯 主要機能
- ユーザー認証（サインアップ/ログイン）
- リアルタイムメッセージ送受信
- メッセージ履歴の保存と表示
- ユーザープロフィール管理
- オンラインステータス表示

## 🏗️ 技術スタック
- **フロントエンド**: React/Next.js
- **バックエンド**: Supabase
  - Authentication: ユーザー認証
  - Database: PostgreSQL
  - Realtime: WebSocket通信
  - Storage: ファイル/画像保存
- **UI Framework**: Tailwind CSS

## 📊 データベース設計

### 1. profiles テーブル
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### 2. conversations テーブル
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  type TEXT DEFAULT 'direct', -- 'direct' or 'group'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### 3. conversation_participants テーブル
```sql
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (conversation_id, user_id)
);
```

### 4. messages テーブル
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'image', 'file'
  file_url TEXT,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

## 🔧 実装手順

### Phase 1: 基盤構築（Week 1）
1. **Supabaseプロジェクトセットアップ**
   - [ ] Supabaseプロジェクト作成
   - [ ] 環境変数設定（.env.local）
   - [ ] Supabaseクライアント初期化

2. **データベース構築**
   - [ ] テーブル作成（SQL実行）
   - [ ] Row Level Security (RLS)設定
   - [ ] リアルタイム機能有効化

3. **認証システム**
   - [ ] サインアップ/ログインページ作成
   - [ ] 認証コンテキスト実装
   - [ ] プロテクトルート設定

### Phase 2: 基本チャット機能（Week 2）
1. **UIコンポーネント開発**
   - [ ] チャットリスト画面
   - [ ] メッセージ表示エリア
   - [ ] メッセージ入力フォーム
   - [ ] ユーザープロフィール表示

2. **メッセージ機能**
   - [ ] メッセージ送信機能
   - [ ] メッセージ取得・表示
   - [ ] ページネーション実装
   - [ ] 既読機能

3. **リアルタイム機能**
   - [ ] リアルタイムサブスクリプション設定
   - [ ] 新着メッセージの自動表示
   - [ ] タイピングインジケーター

### Phase 3: 拡張機能（Week 3）
1. **ファイル共有**
   - [ ] 画像アップロード機能
   - [ ] ファイル共有機能
   - [ ] サムネイル生成

2. **ユーザー体験向上**
   - [ ] オンラインステータス表示
   - [ ] メッセージ検索機能
   - [ ] 通知機能
   - [ ] 絵文字リアクション

3. **グループチャット**
   - [ ] グループ作成機能
   - [ ] メンバー管理
   - [ ] グループ設定画面

### Phase 4: 最適化とテスト（Week 4）
1. **パフォーマンス最適化**
   - [ ] クエリ最適化
   - [ ] キャッシング戦略
   - [ ] 遅延ローディング

2. **セキュリティ強化**
   - [ ] 入力値検証
   - [ ] XSS対策
   - [ ] Rate limiting

3. **テストと品質保証**
   - [ ] ユニットテスト作成
   - [ ] 統合テスト
   - [ ] E2Eテスト

## 📁 ファイル構造
```
src/
├── components/
│   ├── chat/
│   │   ├── ChatList.jsx
│   │   ├── MessageArea.jsx
│   │   ├── MessageInput.jsx
│   │   ├── Message.jsx
│   │   └── UserStatus.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── SignupForm.jsx
│   │   └── ProtectedRoute.jsx
│   └── profile/
│       ├── ProfileCard.jsx
│       └── ProfileEdit.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── ChatContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useMessages.js
│   └── useRealtime.js
├── lib/
│   ├── supabase.js
│   └── utils.js
├── pages/
│   ├── auth/
│   │   ├── login.jsx
│   │   └── signup.jsx
│   ├── chat/
│   │   ├── index.jsx
│   │   └── [conversationId].jsx
│   └── profile/
│       └── [userId].jsx
└── styles/
    └── chat.module.css
```

## 🔑 環境変数
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 注意事項
1. **セキュリティ**
   - RLSポリシーを必ず設定
   - ユーザー入力は必ずサニタイズ
   - APIキーは環境変数で管理

2. **パフォーマンス**
   - 大量のメッセージはページネーション
   - 画像は圧縮してからアップロード
   - 不要なリアルタイムサブスクリプションは解除

3. **UX考慮事項**
   - オフライン時の処理
   - ローディング状態の表示
   - エラーハンドリング

## 🚀 デプロイ
1. Vercelにデプロイ
2. 環境変数を本番環境に設定
3. Supabaseのプロダクション設定を確認

## 📚 参考資料
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)