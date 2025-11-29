# プロフィール取得エラー修正

## 問題
マイページでプロフィール取得時に404エラーが発生していました。原因は、URLパラメータに改行文字（`%0A`）が含まれていたためです。

## 修正内容

### 1. `functions/api/[[path]].js`
以下のエンドポイントで、`user_id`や`as_user`パラメータを取得する際に、改行文字や空白文字を削除する処理を追加しました：

- `railway-users/profile` - プロフィール取得
- `railway-users/stats` - 統計情報取得
- `railway-users/tournaments` - 大会一覧取得
- `railway-home/following` - フォロー中の投稿取得
- `railway-chat/conversations` - 会話一覧取得
- `railway-teams/owner` - 所有チーム取得

**修正例:**
```javascript
let userId = new URL(request.url).searchParams.get('user_id');
// Remove any whitespace characters (including newlines) from user_id
userId = userId.trim().replace(/[\r\n\t]/g, '');
```

### 2. `src/screens/マイページ/Screen14.jsx`
`targetUserId`を設定する際に、改行文字や空白文字を削除する処理を追加しました：

```javascript
let targetUserId = USE_RAILWAY ? (userId || RAILWAY_TEST_USER || user?.id) : (userId || user?.id);
// Remove any whitespace characters (including newlines) from user_id
targetUserId = targetUserId.trim().replace(/[\r\n\t]/g, '');
```

## 修正後の動作
- プロフィール取得時に404エラーが発生しなくなります
- URLパラメータに改行文字が含まれていても、正常に処理されます
- マイページでプロフィール情報が正しく表示されます

## デプロイ
修正内容は本番環境にデプロイ済みです。

