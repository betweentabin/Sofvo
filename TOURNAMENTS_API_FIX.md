# 大会参加履歴API修正レポート

## 修正日時
2024年10月29日

## エラー内容

### エラーメッセージ
```
GET https://sofvo.pages.dev/api/railway-users/tournaments?user_id=e6987383-e866-4d1c-9827-90494f74ebbf&limit=5 500 (Internal Server Error)
```

### エラー発生箇所
- **エンドポイント**: `GET /api/railway-users/tournaments`
- **ファイル**: `functions/api/[[path]].js`
- **行**: 472行目

---

## 原因

`tournament_results`テーブルのスキーマとSQLクエリが一致していませんでした。

### 問題のあったコード
```javascript
const tournaments = await env.DB.prepare(`
  SELECT
    t.id,
    t.name,
    t.start_date,
    t.end_date,
    t.location,
    t.sport_type,
    tr.rank,  // ❌ このカラムは存在しない
    tr.points
  FROM tournament_results tr
  JOIN tournaments t ON tr.tournament_id = t.id
  WHERE tr.user_id = ?
  ORDER BY t.start_date DESC
  LIMIT ?
`).bind(userId, limit).all();
```

### データベーススキーマ
`database/d1-schema.sql`によると、`tournament_results`テーブルの構造は：
```sql
CREATE TABLE IF NOT EXISTS tournament_results (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  user_id TEXT,
  team_id TEXT,
  position INTEGER,  -- ✅ 正しいカラム名
  points INTEGER DEFAULT 0,
  memo TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  ...
);
```

**問題**: `rank`カラムは存在せず、正しいカラム名は`position`です。

---

## 修正内容

### 修正後のコード
```javascript
const tournaments = await env.DB.prepare(`
  SELECT
    t.id,
    t.name,
    t.start_date,
    t.end_date,
    t.location,
    t.sport_type,
    tr.position,  // ✅ 修正: rank → position
    tr.points
  FROM tournament_results tr
  JOIN tournaments t ON tr.tournament_id = t.id
  WHERE tr.user_id = ?
  ORDER BY t.start_date DESC
  LIMIT ?
`).bind(userId, limit).all();
```

### 変更点
- `tr.rank` → `tr.position` に変更

---

## テスト結果

### ✅ 修正後
- `/api/railway-users/tournaments`エンドポイントが正常に動作する
- 500エラーが発生しない
- 大会参加履歴が正しく取得できる

---

## 影響範囲

### 影響を受ける機能
- **マイページ**: 大会参加履歴の表示
- **プロフィール画面**: ユーザーの大会参加履歴の表示

### 修正前の動作
- 500エラーが発生
- 大会参加履歴が表示されない
- コンソールにエラーメッセージが表示される

### 修正後の動作
- 正常に大会参加履歴が取得される
- エラーが発生しない
- マイページに大会参加履歴が表示される

---

## まとめ

`GET /api/railway-users/tournaments`エンドポイントの500エラーを修正しました。

**原因**: `tournament_results`テーブルに存在しない`rank`カラムを参照していた

**修正**: `rank`を`position`に変更

**結果**: エンドポイントが正常に動作し、大会参加履歴が正しく取得できるようになりました。

