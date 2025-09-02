# API調査レポート - Sofvoアプリケーション

## 概要
本レポートは、Sofvoアプリケーションの各画面におけるAPI使用状況とフロントエンド・バックエンド間の連携について調査した結果をまとめたものです。

## 調査結果サマリー

### 統計情報
- **総画面数**: 約40画面
- **API連携済み画面数**: 8画面 (約20%)
- **未実装画面数**: 32画面 (約80%)

### 主要な発見事項
1. **多くの画面が未実装**: 現在、大部分の画面はUIのみでAPI連携が実装されていない
2. **データベーススキーマの不整合**: `follows`テーブルが使用されているが、スキーマに定義されていない
3. **認証システムは動作中**: ログイン、サインアップ、認証状態管理は実装済み

## Supabase設定

### 接続情報
- **設定ファイル**: `/src/lib/supabase.js`
- **環境変数**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **認証設定**: 自動トークン更新、セッション永続化有効

### 利用可能なAPI関数
```javascript
- getUser()           // 現在のユーザー取得
- getProfile(userId)  // プロフィール取得
- signIn()           // ログイン
- signUp()           // サインアップ
- signOut()          // ログアウト
- subscribeToMessages() // メッセージのリアルタイム購読
- getConversations()  // 会話一覧取得
- getMessages()       // メッセージ取得
- sendMessage()       // メッセージ送信
- createConversation() // 会話作成
- addParticipant()    // 参加者追加
```

## データベーススキーマ

### 定義済みテーブル
1. **profiles** - ユーザープロフィール
2. **teams** - チーム情報
3. **team_members** - チームメンバー
4. **conversations** - 会話
5. **conversation_participants** - 会話参加者
6. **messages** - メッセージ
7. **tournaments** - 大会
8. **tournament_participants** - 大会参加者
9. **tournament_results** - 大会結果
10. **notifications** - 通知

### 欠落しているテーブル
- **follows** - フォロー関係（Screen14.jsxで使用されているが未定義）

## 画面別API使用状況

### ✅ API実装済み画面（8画面）

#### 1. ログイン画面 (`/ログイン/ScreenScreen.jsx`)
- **機能**: ユーザー認証
- **API操作**: 
  - `signIn()` - ログイン処理
- **状態**: ✅ 動作中

#### 2. アカウント作成画面 (`/アカウント作成/DivWrapper.jsx`)
- **機能**: 新規ユーザー登録
- **API操作**:
  - `signUp()` - アカウント作成
  - プロフィール自動作成（トリガー経由）
- **状態**: ✅ 動作中

#### 3. マイページ (`/マイページ/Screen14.jsx`)
- **機能**: ユーザープロフィール表示・フォロー管理
- **API操作**:
  - プロフィール取得・作成
  - フォロー/アンフォロー
  - 統計情報取得
  - 大会履歴取得
- **問題点**: ⚠️ `follows`テーブルが未定義

#### 4. プロフィール編集 (`/プロフィール編集/Screen13.jsx`)
- **機能**: プロフィール情報更新
- **API操作**:
  - プロフィール取得
  - プロフィール更新
- **状態**: ✅ 動作可能

#### 5. チーム作成 (`/チーム作成/Screen33.jsx`)
- **機能**: 新規チーム作成
- **API操作**:
  - チーム作成
  - 作成者をオーナーとして登録
- **状態**: ✅ 動作可能

#### 6. チーム画面(管理者) (`/チーム画面(管理者)/Screen17.jsx`)
- **機能**: チーム管理
- **API操作**:
  - 管理チーム一覧取得
  - メンバー情報取得
- **状態**: ✅ 動作可能

#### 7. 大会を主催 (`/大会を主催/Screen37.jsx`)
- **機能**: 大会作成
- **API操作**:
  - 大会情報登録
- **状態**: ✅ 動作可能

#### 8. DM画面 (`/DM/Dm.jsx`)
- **機能**: ダイレクトメッセージ
- **API操作**:
  - ユーザー検索
  - メッセージ送受信（hooks経由）
- **状態**: ✅ 部分的に動作

### ❌ API未実装画面（主要なもの）

以下の画面はUIのみ実装されており、バックエンドとの連携が必要です：

1. **ホーム画面** (`/ホーム/HomeScreen.jsx`)
   - 必要なAPI: フィード取得、推奨コンテンツ

2. **さがす画面** (`/さがす/SearchScreen.jsx`)
   - 必要なAPI: 検索機能（ユーザー、チーム、大会）

3. **おすすめ** (`/おすすめ/Screen10.jsx`)
   - 必要なAPI: レコメンデーション

4. **大会募集画面** (`/大会募集画面/Screen18.jsx`)
   - 必要なAPI: 大会一覧、フィルタリング

5. **参加予定大会** (`/参加予定大会（本日参加）/Screen11.jsx`)
   - 必要なAPI: 参加大会取得

6. **お知らせ** (`/お知らせ/Screen15.jsx`)
   - 必要なAPI: 通知取得、既読管理

7. **チーム画面(メンバー)** (`/チーム画面(メンバー)/Screen16.jsx`)
   - 必要なAPI: チーム詳細、メンバー一覧

8. **大会結果画面** (`/大会結果個別画面/Screen20.jsx`, `/大会結果総合画面/Screen21.jsx`)
   - 必要なAPI: 結果取得、ランキング

9. **設定画面** (`/設定画面/Screen19.jsx`)
   - 必要なAPI: 設定取得・更新

10. **通知設定** (`/通知設定/Screen30.jsx`)
    - 必要なAPI: 通知設定管理

## 発見された問題点

### 🔴 重大な問題

1. **`follows`テーブルの欠落**
   - Screen14.jsx（マイページ）でフォロー機能が実装されているが、データベースにテーブルが存在しない
   - 影響: フォロー機能が動作しない

### 🟡 中程度の問題

1. **API実装率が低い**
   - 約80%の画面でAPI連携が未実装
   - ユーザー体験が大幅に制限される

2. **エラーハンドリングの不足**
   - API呼び出し時のエラー処理が最小限
   - ユーザーへのフィードバックが不十分

3. **リアルタイム機能の未活用**
   - Supabaseのリアルタイム機能設定はあるが、活用されていない画面が多い

### 🟢 軽微な問題

1. **コンポーネント間の連携不足**
   - 各画面が独立しており、状態管理の共有が限定的

2. **型定義の欠如**
   - TypeScriptを使用していないため、API応答の型安全性がない

## 推奨される改善アクション

### 緊急対応（Priority 1）

1. **`follows`テーブルの作成**
```sql
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);
```

### 短期対応（Priority 2）

1. **主要画面のAPI実装**
   - ホーム画面
   - 検索画面
   - 大会一覧画面
   - 通知画面

2. **エラーハンドリングの改善**
   - 統一的なエラー処理
   - ユーザーフレンドリーなエラーメッセージ

### 中期対応（Priority 3）

1. **残りの画面のAPI実装**
2. **リアルタイム機能の活用**
3. **パフォーマンス最適化**
4. **TypeScript導入検討**

## テスト推奨事項

### 動作確認が必要な機能

1. **認証フロー**
   - ✅ ログイン
   - ✅ サインアップ
   - ✅ ログアウト

2. **プロフィール管理**
   - ✅ プロフィール表示
   - ✅ プロフィール編集
   - ❌ フォロー機能（テーブル欠落）

3. **チーム機能**
   - ✅ チーム作成
   - ✅ チーム管理画面
   - ❌ メンバー招待（未実装）
   - ❌ チーム検索（未実装）

4. **大会機能**
   - ✅ 大会作成
   - ❌ 大会参加（未実装）
   - ❌ 結果登録（未実装）
   - ❌ ランキング表示（未実装）

5. **メッセージング**
   - ⚠️ DM機能（部分実装）
   - ❌ グループチャット（未実装）

## まとめ

現在のアプリケーションは基本的な認証とプロフィール管理機能は動作していますが、多くの画面でAPI連携が未実装です。特に`follows`テーブルの欠落は早急に対処が必要です。

優先順位として：
1. データベーススキーマの修正（followsテーブル追加）
2. 主要画面のAPI実装
3. エラーハンドリングとUXの改善

これらの対応により、アプリケーションの完成度を大幅に向上させることができます。