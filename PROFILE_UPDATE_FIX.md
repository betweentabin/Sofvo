# プロフィール更新機能の修正

## 問題
プロフィール編集画面で変更を保存しても、マイページに反映されない問題がありました。

## 原因
1. **API側の問題**:
   - `PUT /api/railway-users/profile`エンドポイントが`user_id`を必須としていたが、認証トークンから取得していなかった
   - 更新可能なフィールドが限られていた（`age`, `gender`, `experience_years`, `team_name`, `location`, `privacy_settings`などが含まれていなかった）
   - 固定のフィールドのみ更新可能で、動的な更新に対応していなかった

2. **フロントエンド側の問題**:
   - `Screen13.jsx`の`handleSubmit`で`updateData`に`user_id`が含まれていなかった
   - エラーメッセージが適切に表示されていなかった

## 修正内容

### 1. `functions/api/[[path]].js` - プロフィール更新API

**修正前:**
- `user_id`をリクエストボディから必須として取得
- 固定のフィールドのみ更新可能

**修正後:**
- 認証トークンから`user_id`を取得（フォールバックとしてリクエストボディからも取得可能）
- 動的なUPDATEクエリを構築し、送信されたフィールドのみを更新
- 以下のフィールドを更新可能に：
  - `username`, `display_name`, `bio`, `sport_type`, `phone`, `furigana`, `avatar_url`
  - `age`, `gender`, `experience_years`, `team_name`, `location`, `privacy_settings`

**主な変更点:**
```javascript
// 認証トークンからuser_idを取得
let userId = null;
const authHeader = request.headers.get('Authorization');
if (authHeader && authHeader.startsWith('Bearer ')) {
  const token = authHeader.slice(7);
  try {
    const tokenData = JSON.parse(atob(token));
    userId = tokenData.id;
  } catch (e) {
    // Token parsing failed, will try request body
  }
}

// 動的なUPDATEクエリを構築
const updates = [];
const values = [];
if (username !== undefined) {
  updates.push('username = ?');
  values.push(username);
}
// ... 他のフィールドも同様に処理
```

### 2. `src/screens/プロフィール編集/Screen13.jsx`

**修正前:**
- `updateData`に`user_id`が含まれていなかった
- エラーメッセージが適切に表示されていなかった

**修正後:**
- `updateData`に`user_id`を追加
- エラーメッセージを改善

**主な変更点:**
```javascript
const updateData = {
  user_id: user.id, // Add user_id to ensure it's sent
  display_name: profile.display_name,
  username: profile.username,
  // ... 他のフィールド
};
```

### 3. `src/screens/マイページ/Screen14.jsx`

**修正前:**
- `useEffect`の依存配列に`user`全体が含まれていた

**修正後:**
- `useEffect`の依存配列を`user?.id`に変更し、ユーザーIDが変更された時のみ再取得

**主な変更点:**
```javascript
useEffect(() => {
  fetchProfile();
}, [userId, user?.id]); // user全体ではなくuser?.idに変更
```

## 修正後の動作

1. **プロフィール編集画面**:
   - すべてのフィールド（表示名、アカウント名、年齢、性別、競技歴、所属チーム、活動地域、自己紹介、プライバシー設定）を更新可能
   - 更新後、マイページに正しく反映される

2. **APIエンドポイント**:
   - 認証トークンから`user_id`を自動取得
   - 送信されたフィールドのみを更新（部分更新に対応）
   - 更新後、最新のプロフィール情報を返す

3. **マイページ**:
   - プロフィール更新後、最新の情報が表示される
   - ユーザーIDが変更された時のみ再取得（パフォーマンス向上）

## デプロイ
修正内容は本番環境にデプロイ済みです。

## テスト方法

1. プロフィール編集画面に移動
2. 任意のフィールドを変更（例: 表示名、自己紹介）
3. 「完了」ボタンをクリック
4. マイページに戻り、変更が反映されていることを確認

