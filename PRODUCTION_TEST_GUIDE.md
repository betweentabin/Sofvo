# 本番環境テストガイド

## テストURL
https://sofvo.pages.dev/

## 実装した機能のテスト手順

### 前提条件
1. ブラウザで https://sofvo.pages.dev/ を開く
2. アカウントでログイン（または新規作成）
3. チームに参加している必要がある

---

## テスト1: ユーザーの所属チーム一覧取得

### ブラウザのコンソールで実行:
```javascript
// 1. ユーザー情報を確認
const user = JSON.parse(localStorage.getItem('user'));
console.log('User ID:', user.id);

// 2. 所属チーム一覧を取得
const response = await fetch(`/api/railway-teams/my-teams?user_id=${user.id}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`
  }
});
const teams = await response.json();
console.log('My Teams:', teams);
console.table(teams.map(t => ({
  チーム名: t.name,
  役割: t.user_role,
  メンバー数: t.member_count
})));
```

### 期待される結果:
- ✅ ユーザーが所属しているチームの一覧が表示される
- ✅ 各チームの役割（owner/admin/member）が表示される
- ✅ メンバー数が正しい

---

## テスト2: チームで大会に参加

### 手順:
1. 大会一覧ページに移動
2. 大会を選択
3. 「参加する」ボタンをクリック
4. 所属チームが選択肢に表示されることを確認
5. チームを選択して参加

### ブラウザコンソールで確認:
```javascript
// 大会ID（大会詳細画面のURLから取得）
const tournamentId = 'your-tournament-id-here';

// 参加状況を確認
const response = await fetch(`/api/railway-tournaments/${tournamentId}/is-participating`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`
  }
});
const result = await response.json();
console.log('参加状況:', result);
```

### 期待される結果:
- ✅ チーム選択肢が表示される
- ✅ 参加に成功する
- ✅ 重複参加は拒否される
- ✅ チームメンバーが既に参加している大会には参加できない

---

## テスト3: 定員到達時の自動対戦表生成

### テストシナリオ:
1. 新しい大会を作成（定員4チーム）
2. 4つのチームで参加
3. 4チーム目の参加時に対戦表が自動生成される

### 確認方法:
```javascript
const tournamentId = 'your-tournament-id';

// 対戦表を取得
const matches = await (await fetch(`/api/railway-tournaments/${tournamentId}/matches`)).json();
console.log('試合数:', matches.length);
console.log('期待: 4チームの総当たり = 6試合');

// 対戦表を見やすく表示
console.table(matches.map(m => ({
  試合番号: m.match_number,
  チーム1: m.team1_name,
  チーム2: m.team2_name,
  状態: m.status
})));
```

### 期待される結果:
- ✅ 4チーム参加で6試合が生成される（4C2 = 6）
- ✅ すべてチーム戦（player1_id, player2_id が null）
- ✅ ランダムシャッフルされている

---

## テスト4: 対戦表のランダム性確認

### 確認方法:
複数の大会で対戦表を生成し、毎回異なる順番になることを確認

```javascript
// 大会1の対戦順
const tournament1Matches = await (await fetch('/api/railway-tournaments/tournament-1-id/matches')).json();
console.log('大会1の最初の試合:', tournament1Matches[0].team1_name, 'vs', tournament1Matches[0].team2_name);

// 大会2の対戦順（同じチームでも異なる順番になるはず）
const tournament2Matches = await (await fetch('/api/railway-tournaments/tournament-2-id/matches')).json();
console.log('大会2の最初の試合:', tournament2Matches[0].team1_name, 'vs', tournament2Matches[0].team2_name);
```

### 期待される結果:
- ✅ 同じチームでも対戦順が異なる
- ✅ ランダムシャッフルが機能している

---

## テスト5: 開催前日の通知確認

### 通知を確認:
```javascript
// 通知一覧を取得
const notifications = await (await fetch('/api/railway-notifications', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('JWT')}` }
})).json();

// 大会関連の通知をフィルタ
const tournamentNotifications = notifications.filter(n =>
  n.type === 'match_schedule' || n.type === 'tournament_reminder'
);

console.table(tournamentNotifications.map(n => ({
  タイプ: n.type,
  タイトル: n.title,
  作成日時: new Date(n.created_at).toLocaleString('ja-JP'),
  内容: n.content.substring(0, 50) + '...'
})));
```

### 確認ポイント:
- ✅ `type: 'match_schedule'` の通知がある
- ✅ `created_at` が開催日の1日前になっている
- ✅ 対戦表の試合数が含まれている
- ✅ 開催日、場所の情報が含まれている

### 通知内容の例:
```
「大会名」が明日開催されます。

対戦表:
試合数: 6試合

開催情報:
開催日: 2025-10-01
場所: 体育館
```

---

## テスト6: チームメンバーへの通知

### 確認方法:
1. チームの他のメンバーでログイン
2. 通知画面を確認
3. 同じ大会の通知が届いているか確認

### 期待される結果:
- ✅ チーム参加の場合、全メンバーに通知が届く
- ✅ 通知内容は同じ

---

## テスト7: 締切日による自動対戦表生成

### テストシナリオ:
1. 締切日が過去の大会を作成（または既存の大会の締切日を過去に設定）
2. バッチ処理エンドポイントを実行

```javascript
// バッチ処理を実行
const response = await fetch('/api/railway-tournaments/auto-generate-matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
console.log('処理結果:', result);
```

### 期待される結果:
- ✅ 締切日を過ぎた大会の対戦表が生成される
- ✅ 処理した大会数が返される
- ✅ 各大会の参加者と試合数が正しい

---

## テスト8: 通知画面での表示

### 確認手順:
1. 通知画面（お知らせ）に移動
2. 通知が表示されることを確認

### 期待される結果:
- ✅ 「対戦表発表」ラベルが表示される
- ✅ 通知内容が正しく表示される
- ✅ 未読/既読の状態が正しい
- ✅ クリックで既読になる

---

## デバッグ用: データベース確認（Cloudflare D1）

### Cloudflare Dashboardでの確認:
1. https://dash.cloudflare.com/ にログイン
2. Pages → sofvo → Settings → Functions → D1 database bindings
3. D1 Console で以下のSQLを実行:

```sql
-- 大会参加者を確認
SELECT
  tp.tournament_id,
  t.name as team_name,
  tp.mode,
  tp.status
FROM tournament_participants tp
LEFT JOIN teams t ON tp.team_id = t.id
LIMIT 10;

-- 対戦表を確認
SELECT
  tm.tournament_id,
  tm.match_number,
  t1.name as team1,
  t2.name as team2
FROM tournament_matches tm
LEFT JOIN teams t1 ON tm.team1_id = t1.id
LEFT JOIN teams t2 ON tm.team2_id = t2.id
ORDER BY tm.tournament_id, tm.match_number
LIMIT 20;

-- 通知を確認
SELECT
  type,
  title,
  created_at,
  read
FROM notifications
WHERE type IN ('tournament_reminder', 'match_schedule')
ORDER BY created_at DESC
LIMIT 10;
```

---

## トラブルシューティング

### 問題1: チーム一覧が空
**原因**: ユーザーがチームに参加していない
**解決**: チーム作成画面でチームを作成するか、既存チームに参加

### 問題2: 対戦表が生成されない
**原因**:
- 参加者が2チーム未満
- 個人参加者が含まれている（チームのみ対応）

**解決**: 2チーム以上のチーム参加を確保

### 問題3: 通知が表示されない
**原因**: `created_at` が未来の日時になっている
**解決**:
- テスト用に通知の日時を現在に変更（D1 Consoleで）
- または、実際の開催前日まで待つ

### 問題4: 重複参加エラー
**原因**: 既に同じモードで参加済み
**解決**: 正常な動作。別の大会で試す

---

## 成功基準

すべてのテストが以下の条件を満たす:
- ✅ エラーなく実行できる
- ✅ 期待される結果が得られる
- ✅ データベースに正しくデータが保存される
- ✅ 通知が正しく作成・表示される

---

## 次のステップ

テストが完了したら:
1. 本番環境で実際のユーザーフローを確認
2. パフォーマンステスト（大量データでの動作確認）
3. エラーハンドリングのテスト
4. UIの最終調整
