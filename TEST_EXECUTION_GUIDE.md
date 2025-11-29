# 大会機能テスト実行ガイド

## 📋 テスト対象機能
1. ✅ **大会開催機能** - 大会の作成と管理
2. ✅ **通知機能** - 開催前日の自動通知
3. ✅ **対戦表作成機能** - 定員到達時・締切日での自動生成

---

## 🌐 テスト環境

### 本番環境（推奨）
- URL: **https://1a43afb3.sofvo.pages.dev**
- または: **https://sofvo.pages.dev**
- データベース: Cloudflare D1（本番）

### ローカル環境
```bash
cd /Users/kuwatataiga/Sofvo
npm run dev
```
- URL: http://localhost:5173
- データベース: Railway PostgreSQL

---

## 🚀 テスト準備

### 1. ログイン
1. https://1a43afb3.sofvo.pages.dev を開く
2. アカウントでログイン（または新規作成）
3. プロフィール情報を入力

### 2. ブラウザ開発者ツールを開く
- Chrome/Edge: `F12` または `Cmd+Option+I` (Mac)
- Safari: `Cmd+Option+C`
- **Consoleタブ** を表示

### 3. ユーザー情報を確認
ブラウザコンソールで実行：
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('ログイン中のユーザー:', user);
console.log('User ID:', user.id);
console.log('Username:', user.username);
```

---

## 📝 テスト1: 大会開催機能

### テストシナリオ
新しい大会を作成し、正常に保存されることを確認

### 手順

#### ステップ1: 大会作成画面に移動
1. メニューから「大会を主催」をクリック
2. フォームが表示されることを確認

#### ステップ2: 大会情報を入力
```
- 大会名: テスト大会 2025
- カテゴリ: バレーボール
- 競技方法: リーグ戦
- 順位決定方法: 勝ち点制
- 開催日: 2025-12-15
- 場所: 東京都
- 会場: 体育館A
- 住所: 東京都渋谷区
- 定員: 4チーム
- 申込締切日: 2025-12-10
```

#### ステップ3: 大会を作成
1. 「作成」ボタンをクリック
2. 「大会を作成しました！」のメッセージを確認
3. 主催大会管理画面に遷移

#### ステップ4: データベースで確認
ブラウザコンソールで実行：
```javascript
// 自分が主催した大会を取得
const user = JSON.parse(localStorage.getItem('user'));
const response = await fetch(`/api/railway-tournaments/my-hosted?as_user=${user.id}`);
const tournaments = await response.json();
console.table(tournaments.map(t => ({
  大会名: t.name,
  開催日: t.start_date,
  場所: t.location,
  状態: t.status,
  作成日: new Date(t.created_at).toLocaleString('ja-JP')
})));
```

### ✅ 成功基準
- [x] 大会が正常に作成される
- [x] 主催大会一覧に表示される
- [x] データベースに保存されている
- [x] すべての入力情報が正しく保存されている

---

## 👥 テスト2: チームで大会に参加

### 前提条件
- テストユーザーがチームに所属している必要があります

### 準備: チームを作成（所属していない場合）
1. 「チーム作成」画面に移動
2. チーム名を入力（例: テストチームA）
3. チームを作成

### テストシナリオ
チームで大会に参加し、参加状況が正しく記録される

### 手順

#### ステップ1: 所属チームを確認
ブラウザコンソールで実行：
```javascript
const user = JSON.parse(localStorage.getItem('user'));
const response = await fetch(`/api/railway-teams/my-teams?user_id=${user.id}`);
const teams = await response.json();
console.log('所属チーム:', teams);
console.table(teams.map(t => ({
  ID: t.id,
  チーム名: t.name,
  役割: t.user_role,
  メンバー数: t.member_count
})));

// 最初のチームIDを保存
const myTeamId = teams[0]?.id;
console.log('使用するチームID:', myTeamId);
```

#### ステップ2: 大会一覧から参加する大会を選択
1. 「さがす」または大会一覧画面に移動
2. 参加したい大会をクリック
3. 「参加する」ボタンをクリック

#### ステップ3: チームモードで参加
ブラウザコンソールで実行（または画面から操作）：
```javascript
// 大会詳細画面のURLから大会IDを取得（例: /tournament-detail/xxx の xxx）
const tournamentId = 'ここに大会IDを入力';
const myTeamId = 'ここにチームIDを入力'; // ステップ1で確認したID

const response = await fetch(`/api/railway-tournaments/${tournamentId}/apply`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mode: 'team',
    team_id: myTeamId
  })
});
const result = await response.json();
console.log('参加結果:', result);
```

#### ステップ4: 参加状況を確認
```javascript
// 参加済みか確認
const checkResponse = await fetch(`/api/railway-tournaments/${tournamentId}/is-participating`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`
  }
});
const status = await checkResponse.json();
console.log('参加状況:', status);
```

### ✅ 成功基準
- [x] 所属チームが正しく取得できる
- [x] チームで大会に参加できる
- [x] 参加状況が正しく記録される
- [x] 重複参加は拒否される

---

## 🎯 テスト3: 対戦表自動生成（定員到達時）

### テストシナリオ
定員4チームの大会に4チームが参加すると、自動的に対戦表（6試合）が生成される

### 準備
1. 定員4チームの大会を作成（テスト1を参照）
2. 4つのテストチーム/ユーザーを用意

### 手順

#### ステップ1: 現在の参加状況を確認
```javascript
const tournamentId = 'ここに大会IDを入力';

// 参加者一覧を取得
const participantsResp = await fetch(`/api/railway-tournaments/${tournamentId}/participants`);
const participants = await participantsResp.json();
console.log('現在の参加者数:', participants.length);
console.table(participants.map(p => ({
  チーム名: p.team_name,
  モード: p.mode,
  状態: p.status
})));
```

#### ステップ2: 4チーム目が参加
```javascript
// 4チーム目として参加
const response = await fetch(`/api/railway-tournaments/${tournamentId}/apply`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mode: 'team',
    team_id: 'ここに4チーム目のIDを入力'
  })
});
const result = await response.json();
console.log('参加結果:', result);
console.log('対戦表生成フラグ:', result.matches_generated);
```

#### ステップ3: 対戦表を確認
```javascript
// 対戦表を取得
const matchesResp = await fetch(`/api/railway-tournaments/${tournamentId}/matches`);
const matches = await matchesResp.json();

console.log('=== 対戦表 ===');
console.log('試合数:', matches.length);
console.log('期待値: 4チーム総当たり = 6試合 (4C2)');
console.log('');

matches.forEach((match, index) => {
  console.log(`試合${match.match_number}: ${match.team1_name} vs ${match.team2_name}`);
});

// 表形式で表示
console.table(matches.map(m => ({
  試合番号: m.match_number,
  チーム1: m.team1_name,
  チーム2: m.team2_name,
  状態: m.status,
  モード: m.match_mode
})));
```

#### ステップ4: データの正確性を検証
```javascript
// 検証項目
const validation = {
  '試合数が6試合': matches.length === 6,
  'すべてチーム戦': matches.every(m => m.match_mode === 'team'),
  'player_idがnull': matches.every(m => !m.player1_id && !m.player2_id),
  'team_idが設定': matches.every(m => m.team1_id && m.team2_id),
  '試合番号が連番': matches.every((m, i) => m.match_number === i + 1)
};

console.log('=== 検証結果 ===');
Object.entries(validation).forEach(([key, value]) => {
  console.log(`${value ? '✅' : '❌'} ${key}`);
});
```

### ✅ 成功基準
- [x] 4チーム目の参加で対戦表が自動生成される
- [x] 6試合（4C2）が生成される
- [x] すべてチーム戦（team1_id, team2_id が設定）
- [x] player1_id, player2_id は null
- [x] 試合番号が1から連番
- [x] ランダムにシャッフルされている

---

## 📅 テスト4: 対戦表自動生成（締切日）

### テストシナリオ
申込締切日を過ぎた大会は、バッチ処理で自動的に対戦表が生成される

### 準備
1. 締切日が過去の大会を作成（または既存大会の締切日を過去に変更）

### 手順

#### ステップ1: テスト用大会の準備
```javascript
// 方法A: 新しい大会を作成（締切日を昨日に設定）
// 大会作成画面で実施

// 方法B: 既存大会の締切日を変更（Cloudflare D1で直接実行）
// UPDATE tournaments 
// SET registration_deadline = date('now', '-1 day')
// WHERE id = 'your-tournament-id';
```

#### ステップ2: 2チーム以上参加させる
```javascript
// テスト1, 2の手順で2チーム以上参加
```

#### ステップ3: バッチ処理を実行
```javascript
const response = await fetch('/api/railway-tournaments/auto-generate-matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});
const result = await response.json();

console.log('=== バッチ処理結果 ===');
console.log('処理成功:', result.success);
console.log('処理した大会数:', result.processed);
console.log('');
console.log('大会詳細:');
console.table(result.tournaments?.map(t => ({
  大会名: t.tournament_name,
  参加者数: t.participants,
  生成試合数: t.matches_created
})));
```

#### ステップ4: 対戦表を確認
```javascript
const tournamentId = result.tournaments[0]?.tournament_id;
if (tournamentId) {
  const matchesResp = await fetch(`/api/railway-tournaments/${tournamentId}/matches`);
  const matches = await matchesResp.json();
  console.log('対戦表:', matches);
}
```

### ✅ 成功基準
- [x] 締切日を過ぎた大会が処理される
- [x] 2チーム以上で対戦表が生成される
- [x] バッチ処理の結果が正しく返される
- [x] 生成された試合数が正しい（nC2）

---

## 🔔 テスト5: 開催前日の通知機能

### テストシナリオ
大会開催の前日に、参加者全員（チームの場合は全メンバー）に対戦表発表の通知が送信される

### 準備
1. 対戦表が生成済みの大会（テスト3または4で作成）
2. 開催日の設定を確認

### 手順

#### ステップ1: 通知が作成されているか確認

**注意**: 通知は開催日の1日前に作成されます。テストのため、created_atを現在時刻に変更します。

**Cloudflare D1 Consoleで実行**:
```sql
-- 1. 通知を確認
SELECT 
  n.id,
  n.type,
  n.title,
  n.created_at,
  n.tournament_id,
  p.username
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE n.type = 'match_schedule'
ORDER BY n.created_at DESC
LIMIT 10;

-- 2. テスト用に通知日時を現在に変更
UPDATE notifications
SET created_at = datetime('now')
WHERE type = 'match_schedule'
AND tournament_id = 'your-tournament-id';
```

#### ステップ2: アプリで通知を確認
1. 通知（お知らせ）画面に移動
2. 「対戦表発表」の通知が表示されることを確認

#### ステップ3: ブラウザコンソールで通知を取得
```javascript
const response = await fetch('/api/railway-notifications', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('JWT')}`
  }
});
const notifications = await response.json();

// 大会関連の通知をフィルタ
const tournamentNotifs = notifications.filter(n =>
  n.type === 'match_schedule' || n.type === 'tournament_reminder'
);

console.log('=== 大会関連通知 ===');
console.table(tournamentNotifs.map(n => ({
  タイプ: n.type,
  タイトル: n.title,
  作成日時: new Date(n.created_at).toLocaleString('ja-JP'),
  既読: n.read ? '既読' : '未読'
})));

// 最新の通知内容を表示
if (tournamentNotifs.length > 0) {
  const latestNotif = tournamentNotifs[0];
  console.log('=== 最新の通知内容 ===');
  console.log('タイトル:', latestNotif.title);
  console.log('内容:');
  console.log(latestNotif.content);
}
```

#### ステップ4: 通知内容の確認
通知には以下の情報が含まれているか確認：
- ✅ 大会名
- ✅ 開催日
- ✅ 開催場所
- ✅ 対戦表の試合数
- ✅ 「明日開催されます」のメッセージ

### ✅ 成功基準
- [x] 開催前日に通知が作成される
- [x] 参加者全員に通知が届く
- [x] チーム参加の場合、チームメンバー全員に通知
- [x] 通知内容が正しい（大会名、日時、場所、試合数）
- [x] 通知画面に「対戦表発表」ラベルで表示される
- [x] クリックで既読になる

---

## 🔄 テスト6: 対戦表のランダム性

### テストシナリオ
同じチームでも、大会ごとに対戦順がランダムになることを確認

### 手順

#### ステップ1: 複数の大会を作成
1. 同じ設定で3つの大会を作成
2. 同じ4チームで参加

#### ステップ2: 対戦表を比較
```javascript
const tournament1 = 'tournament-id-1';
const tournament2 = 'tournament-id-2';
const tournament3 = 'tournament-id-3';

// 各大会の対戦表を取得
const matches1 = await (await fetch(`/api/railway-tournaments/${tournament1}/matches`)).json();
const matches2 = await (await fetch(`/api/railway-tournaments/${tournament2}/matches`)).json();
const matches3 = await (await fetch(`/api/railway-tournaments/${tournament3}/matches`)).json();

console.log('=== 大会1の対戦順 ===');
matches1.forEach(m => console.log(`${m.match_number}: ${m.team1_name} vs ${m.team2_name}`));

console.log('\n=== 大会2の対戦順 ===');
matches2.forEach(m => console.log(`${m.match_number}: ${m.team1_name} vs ${m.team2_name}`));

console.log('\n=== 大会3の対戦順 ===');
matches3.forEach(m => console.log(`${m.match_number}: ${m.team1_name} vs ${m.team2_name}`));

// 最初の試合が異なるか確認
const firstMatches = [
  `${matches1[0].team1_name} vs ${matches1[0].team2_name}`,
  `${matches2[0].team1_name} vs ${matches2[0].team2_name}`,
  `${matches3[0].team1_name} vs ${matches3[0].team2_name}`
];

console.log('\n=== ランダム性の確認 ===');
console.log('各大会の最初の試合:', firstMatches);
const allSame = firstMatches[0] === firstMatches[1] && firstMatches[1] === firstMatches[2];
console.log(allSame ? '❌ すべて同じ（ランダムではない）' : '✅ 異なる対戦順（ランダム）');
```

### ✅ 成功基準
- [x] 同じチームでも対戦順が異なる
- [x] Fisher-Yatesシャッフルが機能している
- [x] 対戦組み合わせ自体は同じ（総当たり）だが順番が異なる

---

## 🔍 デバッグ用SQLクエリ

### Cloudflare D1 Consoleでの確認

#### 大会情報
```sql
SELECT 
  id,
  name,
  start_date,
  location,
  max_participants,
  registration_deadline,
  status,
  created_at
FROM tournaments
ORDER BY created_at DESC
LIMIT 10;
```

#### 大会参加者
```sql
SELECT 
  tp.tournament_id,
  t.name as tournament_name,
  tp.mode,
  CASE 
    WHEN tp.mode = 'team' THEN tm.name
    ELSE p.username
  END as participant_name,
  tp.status
FROM tournament_participants tp
LEFT JOIN tournaments t ON tp.tournament_id = t.id
LEFT JOIN teams tm ON tp.team_id = tm.id
LEFT JOIN profiles p ON tp.user_id = p.id
WHERE tp.tournament_id = 'your-tournament-id'
ORDER BY tp.created_at;
```

#### 対戦表
```sql
SELECT 
  tm.tournament_id,
  t.name as tournament_name,
  tm.match_number,
  tm.match_mode,
  t1.name as team1,
  t2.name as team2,
  tm.status
FROM tournament_matches tm
LEFT JOIN tournaments t ON tm.tournament_id = t.id
LEFT JOIN teams t1 ON tm.team1_id = t1.id
LEFT JOIN teams t2 ON tm.team2_id = t2.id
WHERE tm.tournament_id = 'your-tournament-id'
ORDER BY tm.match_number;
```

#### 通知
```sql
SELECT 
  n.id,
  n.type,
  n.title,
  n.tournament_id,
  n.created_at,
  n.read,
  p.username
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE n.type IN ('match_schedule', 'tournament_reminder')
ORDER BY n.created_at DESC
LIMIT 20;
```

#### チームメンバー
```sql
SELECT 
  tm.team_id,
  t.name as team_name,
  tm.user_id,
  p.username,
  tm.role,
  tm.status
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
LEFT JOIN profiles p ON tm.user_id = p.id
WHERE tm.team_id = 'your-team-id';
```

---

## ❓ トラブルシューティング

### 問題1: チーム一覧が空
**原因**: ユーザーがチームに参加していない
**解決策**:
1. チーム作成画面でチームを作成
2. または既存チームに参加

### 問題2: 対戦表が生成されない
**原因**:
- 参加者が2チーム未満
- 個人参加者が混在している（現在はチームのみ対応）

**解決策**:
1. 2チーム以上が参加していることを確認
2. すべてチームモードで参加していることを確認

### 問題3: 通知が表示されない
**原因**: `created_at` が未来の日時になっている
**解決策**:
- D1 Consoleで `created_at` を現在時刻に変更
- または実際の開催前日まで待つ

### 問題4: "Authorization header missing"エラー
**原因**: JWTトークンが設定されていない
**解決策**:
```javascript
// ログイン状態を確認
const jwt = localStorage.getItem('JWT');
console.log('JWT存在:', !!jwt);

// JWTがない場合は再ログイン
if (!jwt) {
  alert('再度ログインしてください');
  window.location.href = '/login';
}
```

### 問題5: CORS エラー
**原因**: 本番環境のCORS設定
**解決策**:
- ブラウザコンソールからではなく、アプリのUI経由で操作
- または `wrangler.toml` のCORS設定を確認

---

## 📊 テスト完了チェックリスト

### 大会開催機能
- [ ] 大会を作成できる
- [ ] 作成した大会が一覧に表示される
- [ ] 大会情報が正しく保存される

### チーム参加機能
- [ ] 所属チームを取得できる
- [ ] チームで大会に参加できる
- [ ] 参加状況が正しく記録される
- [ ] 重複参加が防止される

### 対戦表自動生成（定員）
- [ ] 定員到達で自動生成される
- [ ] 正しい試合数が生成される（nC2）
- [ ] チーム戦として記録される
- [ ] ランダムにシャッフルされる

### 対戦表自動生成（締切）
- [ ] 締切日を過ぎた大会が処理される
- [ ] バッチ処理が正常に実行される
- [ ] 対戦表が生成される

### 通知機能
- [ ] 開催前日に通知が作成される
- [ ] 参加者全員に通知が届く
- [ ] チームメンバー全員に通知が届く
- [ ] 通知内容が正しい
- [ ] 通知画面に表示される
- [ ] 既読処理が動作する

### ランダム性
- [ ] 対戦順がランダムになる
- [ ] 同じチームでも異なる順番

---

## 📝 テスト結果の記録

テスト実行後、以下の形式で結果を記録してください：

```
テスト実行日: 2025年11月29日
テスト環境: 本番環境 (https://1a43afb3.sofvo.pages.dev)
テスト実施者: [名前]

【結果サマリー】
- 大会開催: ✅ / ❌
- チーム参加: ✅ / ❌
- 対戦表生成（定員）: ✅ / ❌
- 対戦表生成（締切）: ✅ / ❌
- 通知機能: ✅ / ❌
- ランダム性: ✅ / ❌

【発見した問題】
1. ...
2. ...

【コメント】
...
```

---

## 🎯 次のステップ

テスト完了後：
1. ✅ すべての機能が正常に動作することを確認
2. 📝 テスト結果をドキュメント化
3. 🐛 発見したバグを修正
4. 🚀 本番環境での実運用開始
5. 📊 パフォーマンス監視とログ確認

---

**準備完了！テストを開始しましょう！** 🚀

