# 静的→動的 化計画（UIは既存デザインを厳守）

本ドキュメントでは、現状静的な表示に留まっている画面/要素を、既存のデザイン（クラス名・レイアウト）を活かしたまま最小改修で動的化する計画をまとめます。

## 方針
- 既存のクラス名・DOM構造を維持し、文言・値のみをAPI結果で置換する。
- 既存のスタイルを壊さないため、プレースホルダー要素はなるべく残しつつ「表示内容」だけ差し替える。
- すでに導入済みの Railway API 群（`src/services/api.js`）を最優先で利用する。
- 可能な限り「バックエンド改修なし」で進め、必要箇所は別途明示する。

## 環境前提
- `.env.local` にて Railway データを利用（既に有効）
  - `VITE_RAILWAY_DATA=true`
  - `VITE_NODE_API_URL` は Web では `/api`、モバイルはフルURLを利用

---

## 静的箇所の洗い出し（要動的化）

1) 大会結果の表レイアウト（本選/予選）のハードコード
- 個別: `src/screens/大会結果個別画面/Screen20.jsx:127` 以降の行ブロック
- 総合: `src/screens/大会結果総合画面/Screen21.jsx:124` 以降の行ブロック
- 現状は固定行。APIの結果に応じた行生成に置換する。

2) 「本日の大会」「参加予定大会」画面が固定
- `src/screens/参加予定大会（本日参加）/Screen11.jsx:24`, `:103`
- 本日のチェックイン/参加予定をAPIで取得し、既存の枠に代入。

3) チーム画面（管理者/メンバー）の固定表示
- 管理者: `src/screens/チーム画面(管理者)/Screen17.jsx:64`（地域固定）, `:72`（ポイント等固定）, `:103`（ダミー大会）
- メンバー: `src/screens/チーム画面(メンバー)/Screen16.jsx:68`, `:91` 他
- 取得済みのチーム/メンバー情報で埋める。ポイント等は将来拡張（後述）。

4) チームプロフィール編集（UIのみ）
- `src/screens/チームプロフィール編集/Screen24.jsx`
- 読み込み/保存API未連携。オーナーチームの名称/地域/説明を読み込み、保存ボタンで更新。

5) 登録情報変更（UIのみ）
- `src/screens/登録情報変更/Screen22.jsx`
- 現状は単なる入力枠。最低限、プロフィール（表示名/自己紹介等）の更新と連動、メール・パスワードはバックエンド仕様次第。

6) 退会（UIのみ）
- `src/screens/退会/Screen31.jsx:69`
- 実際の削除APIは `api.users.deleteAccount()` があるので接続可能。

7) お問い合わせ（送信/確認/完了）
- 記入: `src/screens/お問い合わせ（記入）/Screen29.jsx`
- 確認: `src/screens/大会を編集/Screen38.jsx`（中身は確認画面）
- 完了: `src/screens/お問い合わせ（送信）/Screen27.jsx`
- `api.contact.send()` を確認画面の「送信する」に接続し、成功時に完了画面に遷移。

8) DM 会話一覧（サイドバー）
- `src/screens/DM/Dm.jsx:169` 付近
- 実データは `railwayConversations` に入っているが、描画は `conversations` を使用。表示リストを実データに切替。

9) 検索ドロップダウンの選択肢が静的
- `src/screens/Sagasu/SearchScreen.jsx:90`（年月/地域/種別）
- 初期は静的のまま、将来的にメタAPI化（候補）。

10) 広告画面（おすすめ）が固定
- `src/screens/おすすめ/Screen10.jsx`
- バックエンド未整備のため後回し（プレースホルダーのまま）。

11) パスワードリセットは案内のみ（仮）
- `src/screens/パスワードリセット/ResetPassword.jsx`
- バックエンドのリセットエンドポイントが整備され次第接続。

---

## 実装プラン（段階的）

### Phase 1（バックエンド改修なし・UI崩さない即効タスク）
1. DM会話一覧を実データに差替
   - 変更: `src/screens/DM/Dm.jsx`
   - 方針: `railwayConversations` を `conversations` に反映して既存描画を活かす。

2. お問い合わせの送信実装
   - 変更: `src/screens/大会を編集/Screen38.jsx`
   - 方針: 「送信する」で `api.contact.send(state)` を呼び、成功で `/contact-complete` に遷移。UIは既存。

3. 退会の実処理
   - 変更: `src/screens/退会/Screen31.jsx`
   - 方針: 「退会する」をボタンに変更し `api.users.deleteAccount()` 実行→ `signOut()`→ `/login`。確認ダイアログ追加。

4. （任意）主催大会管理/メンバー管理のフォールバック調整
   - 変更: 既に Railway 連携済。環境で `VITE_RAILWAY_DATA=true` を維持。

### Phase 0.5（横断エラー確認/ハンドリング）
0. Appレベル ErrorBoundary を導入（UI例外を安全に捕捉）
   - 変更: `src/components/ErrorBoundary.jsx`, `src/AppRoot.jsx`
   - 方針: 既存レイアウトを大きく変えず、全画面で例外時に再読み込みを促す簡易UIを表示。

### Phase 2（UIデータ結合だがロジック調整が必要）
5. 大会結果表示の動的化（第一段階）
   - 変更: `Screen20.jsx`, `Screen21.jsx`
   - 方針: `results` 全件をリスト表示（順位・名称・ポイント）。既存の概要枠内で見た目を維持しつつ、固定3件→全件に拡張。
   - 第二段階: 試合詳細スキーマが揃い次第、`.row/.cell` 構造の対戦表生成へ移行。

6. 「本日の大会/参加予定大会」の動的化
   - 変更: `src/screens/参加予定大会（本日参加）/Screen11.jsx`
   - 方針: 近似APIで代替（例: 検索API + 日付フィルタ）。必要に応じてバックエンド側に「本日/参加予定」専用エンドポイント追加を別途依頼。

7. チーム画面（管理者/メンバー）の固定部分を実データに
   - 管理者: チーム説明/作成日は既に反映済。地域/ポイント等は API の提供次第で段階導入。
   - メンバー: まずはチーム名・人数・説明を表示。将来的に活動記録へ投稿連携（`railwayPosts` フィルタ）。

8. チームプロフィール編集の読込/保存
   - 変更: `src/screens/チームプロフィール編集/Screen24.jsx`
   - 方針: オーナーチーム取得（`api.railwayTeams.getOwnerTeam`）で初期値セット済。保存は `api.railwayTeams.updateTeam(asUser, teamId, payload)` を実装し、UIから呼び出し（`PUT /railway-teams/update` 前提）。

### Phase 3（バックエンド側の機能が必要）
9. 登録情報変更（メール/電話/パスワード）
   - 変更: `src/screens/登録情報変更/Screen22.jsx`
   - 方針: 現行の `users.updateProfile` はプロフィール用。アカウント属性の更新API（メール/電話/パスワード変更）を要追加。

10. パスワードリセット連携
   - 変更: `src/screens/パスワードリセット/ResetPassword.jsx`
   - 方針: `POST /auth/reset-password` 等のAPI追加後に接続。

11. 検索ドロップダウンの動的メタ
   - 変更: `src/screens/Sagasu/SearchScreen.jsx`
   - 方針: 地域・種別・年月の選択肢をメタAPIで供給（マスタ管理）。

12. 広告画面の動的化
   - 変更: `src/screens/おすすめ/Screen10.jsx`
   - 方針: スポンサー/広告APIの検討が必要。

---

## 具体的な実装メモ（抜粋）

### A. DM 会話一覧（最小改修）
- `railwayConversations`取得済みのため、描画元を切り替えるだけ。
- 例: `useEffect(() => setConversations(railwayConversations), [railwayConversations])` を追加。

### B. お問い合わせ送信
- `Screen38.jsx` の「送信する」を押下時に以下を実施：
  ```js
  const handleSend = async () => {
    try {
      await api.contact.send(formData); // state で受け取った値
      navigate('/contact-complete');
    } catch (e) {
      alert('送信に失敗しました');
    }
  };
  ```
- デザインは既存のボタン/クラスを流用し、onClick だけ追加。

### C. 退会の実処理
- `Screen31.jsx` の「退会する」を `button` に変更し、以下を実行：
  ```js
  if (confirm('本当に退会しますか？')) {
    await api.users.deleteAccount();
    await signOut();
    navigate('/login', { replace: true });
  }
  ```

### D. 大会結果表の動的生成
- 現在の `.row`/`.cell` を維持しつつ、`results` 配列から `map` で行を生成。
- データが不足している箇所は非表示 or ダッシュ表示に切替（既存の見た目を維持）。

---

## 受け入れ基準（サマリ）
- UI の見た目（クラス/レイアウト/色）は変えない。
- DM サイドバーに実会話が一覧表示され、クリックで既存の `ChatRoom` が開く。
- お問い合わせは確認→送信→完了まで一連のフローが成立。
- 退会は実際にアカウントが削除され、ログアウト→ログイン画面へ遷移。
- 大会結果画面は、固定件数でなく `results` 全件表示（見た目は同等）。

---

## チェックリスト（進捗管理）
- [x] DM 会話一覧のデータ源を `railwayConversations` に統一（`src/screens/DM/Dm.jsx`）
- [x] お問い合わせ送信ボタンで `api.contact.send()` を実行（`src/screens/大会を編集/Screen38.jsx`）
- [x] 退会ボタンに `api.users.deleteAccount()` を接続（`src/screens/退会/Screen31.jsx`）
- [x] 大会結果（個別/総合）のリスト表示を `results` 全件に拡張（`Screen20.jsx`/`Screen21.jsx`）
- [x] 大会結果の表領域を `results` に応じて動的生成（既存クラス構造を維持）
- [x] 本日/参加予定大会のカードをAPIから生成（`src/screens/参加予定大会（本日参加）/Screen11.jsx`）
- [ ] チーム画面（管理者/メンバー）で固定文言を実値に置換（`Screen17.jsx`/`Screen16.jsx`）
  - [x] 管理者画面の所属メンバー数/地域を動的化（`Screen17.jsx`）
  - [x] メンバー画面の固定文言除去と動的値表示（`Screen16.jsx`）
  - [x] 本日の大会/参加予定大会のカードを検索APIで表示（`Screen17.jsx`/`Screen16.jsx`）
- [x] 検索画面の選択肢をランタイム設定に対応（年月：動的生成、地域/種別：`window.__APP_CONFIG__` があれば使用）
- [x] 主催画面の選択肢をランタイム設定に対応（地域/種別/競技方法/順位方法：`window.__APP_CONFIG__` があれば使用）
- [x] チーム統計（ポイント/フォロー/フォロワー）を動的化（`/railway-teams/stats` が有効な場合に表示。`Screen17.jsx`/`Screen16.jsx`）
- [ ] チームプロフィール編集の読込/保存実装（`Screen24.jsx`）
  - [x] 読込（初期値の表示）
  - [x] 保存UI + API呼出（`PUT /railway-teams/update` が有効な場合に動作）
- [ ] 登録情報変更（メール/電話/パスワード）APIの仕様合意（`Screen22.jsx`）
- [ ] パスワードリセットAPIの仕様合意（`ResetPassword.jsx`）
 - [x] Appレベル ErrorBoundary を導入（`src/components/ErrorBoundary.jsx` / `src/AppRoot.jsx`）
 - [x] エラー確認ガイドの作成（`docs/error-checking.md`）

---

## 進捗更新ログ

### v2025-10-25
- 実装: DM 会話一覧の動的化（UIは既存そのまま）
- 実装: お問い合わせの送信（確認→送信→完了まで一連）
- 実装: 退会の実処理（削除→サインアウト→ログイン画面）
- 実装: 参加予定大会（本日参加）の基本動的化（今日/今後の大会を検索APIから取得して表示、UIは既存クラスを維持）
- 実装: チーム画面（管理者）の所属メンバー数と地域表示を動的化（オーナーチーム→メンバー取得）
- 実装: チームプロフィール編集の初期値を動的読込（オーナーチームの名称/地域/説明）
- 微修正: 大会募集画面のエントリー確認モーダル文言を大会名で動的化（`Screen18.jsx`）
- 実装: チーム画面（メンバー/管理者）における「本日の大会」と「参加予定大会」を検索API結果で動的表示（既存クラス維持）
- 実装: Appレベル ErrorBoundary を導入（重大なUI例外の安全な捕捉/再読み込み誘導）
- ドキュメント: エラー確認ガイド（`docs/error-checking.md`）を追加
- 次の候補: 大会結果（個別/総合）の固定表を API 結果で生成、チーム画面（メンバー）の固定文言除去/動的化、チームプロフィール編集の読込/保存
