# 大会機能テストガイド

## 前提条件
- ローカル環境で `npm run dev` が起動している
- テストユーザーとチームが作成されている

## テスト1: ユーザーの所属チーム取得

### APIエンドポイント
```bash
GET /api/railway-teams/my-teams?user_id={userId}
```

### テスト方法（ブラウザコンソール）
```javascript
// ログイン中のユーザーIDを取得
const user = JSON.parse(localStorage.getItem('user'));
console.log('User ID:', user.id);

// 所属チーム一覧を取得
const response = await fetch(`/api/railway-teams/my-teams?user_id=${user.id}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`
  }
});
const teams = await response.json();
console.log('My Teams:', teams);
```

### 期待される結果
```json
[
  {
    "id": "team-uuid",
    "name": "チーム名",
    "user_role": "owner",
    "member_count": 5,
    ...
  }
]
```

---

## テスト2: チームで大会に参加

### APIエンドポイント
```bash
POST /api/railway-tournaments/{tournamentId}/apply
Body: { "mode": "team", "team_id": "{teamId}" }
```

### テスト方法（ブラウザコンソール）
```javascript
const tournamentId = 'your-tournament-id';
const teamId = 'your-team-id';

const response = await fetch(`/api/railway-tournaments/${tournamentId}/apply`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mode: 'team',
    team_id: teamId
  })
});
const result = await response.json();
console.log('Apply Result:', result);
```

### 期待される結果
```json
{
  "success": true,
  "message": "Successfully applied to tournament",
  "participant": {
    "id": "participant-uuid",
    "tournament_id": "tournament-uuid",
    "user_id": "user-uuid",
    "team_id": "team-uuid",
    "mode": "team",
    "status": "registered"
  },
  "matches_generated": false
}
```

---

## テスト3: 定員到達時の自動対戦表生成

### テストシナリオ
1. 大会を作成（max_participants=4）
2. 4チームが参加
3. 4チーム目の参加時に対戦表が自動生成される

### 確認ポイント
```javascript
// 対戦表を確認
const response = await fetch(`/api/railway-tournaments/${tournamentId}/matches`);
const matches = await response.json();
console.log('Matches:', matches);
console.log('Match Count:', matches.length);
// 期待: 4チームの総当たり = 6試合 (4C2 = 6)
```

---

## テスト4: 対戦表がランダムか確認

### 確認方法
```javascript
// 対戦表を確認
const matches = await (await fetch(`/api/railway-tournaments/${tournamentId}/matches`)).json();
matches.forEach(m => {
  console.log(`Match ${m.match_number}: ${m.team1_name} vs ${m.team2_name}`);
});

// 再度対戦表を削除して生成し直し、順番が変わるか確認
// （本番では削除機能がないため、別の大会で確認）
```

---

## テスト5: 開催前日の通知確認

### データベース確認
```sql
-- 通知が作成されているか確認
SELECT * FROM notifications
WHERE type = 'match_schedule'
ORDER BY created_at DESC
LIMIT 10;
```

### 通知のcreated_atを確認
- `created_at` が開催日の1日前になっているか
- 参加者全員分の通知が作成されているか

### テスト方法（created_atを現在時刻に変更）
```sql
-- テスト用に通知日時を現在に変更
UPDATE notifications
SET created_at = datetime('now')
WHERE type = 'match_schedule'
AND tournament_id = 'your-tournament-id';
```

その後、アプリの通知画面を確認

---

## テスト6: 締切日による自動対戦表生成

### バッチ処理エンドポイント
```bash
POST /api/railway-tournaments/auto-generate-matches
```

### テスト方法
```javascript
const response = await fetch('/api/railway-tournaments/auto-generate-matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
console.log('Batch Result:', result);
```

### 期待される結果
```json
{
  "success": true,
  "processed": 2,
  "tournaments": [
    {
      "tournament_id": "xxx",
      "tournament_name": "大会名",
      "participants": 4,
      "matches_created": 6
    }
  ]
}
```

---

## デバッグ用SQLクエリ

### 大会の参加者を確認
```sql
SELECT
  tp.id,
  tp.tournament_id,
  tp.user_id,
  tp.team_id,
  tp.mode,
  t.name as team_name
FROM tournament_participants tp
LEFT JOIN teams t ON tp.team_id = t.id
WHERE tp.tournament_id = 'your-tournament-id';
```

### 対戦表を確認
```sql
SELECT
  tm.*,
  t1.name as team1_name,
  t2.name as team2_name
FROM tournament_matches tm
LEFT JOIN teams t1 ON tm.team1_id = t1.id
LEFT JOIN teams t2 ON tm.team2_id = t2.id
WHERE tm.tournament_id = 'your-tournament-id'
ORDER BY tm.match_number;
```

### 通知を確認
```sql
SELECT
  n.id,
  n.type,
  n.title,
  n.content,
  n.created_at,
  p.username
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE n.type IN ('tournament_reminder', 'match_schedule')
ORDER BY n.created_at DESC
LIMIT 20;
```

---

## よくある問題と解決方法

### 1. チーム一覧が空
- ユーザーがチームに参加していない
- team_membersテーブルを確認

### 2. 対戦表が生成されない
- 参加者が2チーム未満
- max_participantsが設定されていない（締切日モードの場合）
- エラーログを確認

### 3. 通知が表示されない
- created_atが未来の日時になっている
- 通知画面のフィルタリング条件を確認

### 4. チームメンバーに通知が届かない
- team_membersテーブルにメンバーが登録されているか確認
- ループ処理が正しく動作しているか確認
