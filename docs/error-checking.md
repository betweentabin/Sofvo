# エラー確認ガイド（Sofvo フロントエンド）

本ガイドは、開発/検証時に発生しうるエラーの確認ポイント、切り分け手順、想定される原因と対処のヒントをまとめたものです。既存デザインを崩さず動的化した画面の検証観点も含みます。

## 1. 前提/環境
- Node API ベースURLは実行環境に応じて自動解決（`src/services/api.js` / `src/contexts/AuthContext.jsx`）。
  - Vercel: 相対 `/api`（リライトルール前提）
  - Capacitor: `window.__APP_CONFIG__.nodeApiUrl` もしくは `http://localhost:5000/api`
  - ローカルWeb: `http://localhost:5000/api`
- ランタイム設定: `src/config/runtimeConfig.js` 経由で `window.__APP_CONFIG__` に読み込まれます。
- 認証: JWT は `localStorage.JWT` に保存され、axios インターセプターで自動付与されます。

## 2. 画面別チェック（動的化済み）
- DM一覧（/dm）
  - 期待: 会話一覧が表示され、選択で右側のChatが開く。
  - 確認: `GET /railway-chat/conversations?as_user=<id>` が200で返ること。
- お問い合わせ（確認→送信→完了）
  - 期待: 確認画面の「送信する」で `POST /contact` 成功後に完了画面へ遷移。
- 退会（/account-delete）
  - 期待: 「退会する」で `DELETE /users/me` 成功→ signOut → /login へ。
- 本日/参加予定大会（/tournament-schedule）
  - 期待: `GET /railway-tournaments/search?status=upcoming` から今日/今後の大会が表示。
- 通知（/notifications）
  - 期待: 一覧表示・既読化・すべて既読が機能。
  - ヘッダーバッジ: 未読件数が表示され、既読操作やpush受信で更新。
  - 確認: `GET /railway-notifications/unread-count`, `PUT /railway-notifications/read-all`, `PUT /railway-notifications/{id}/read` が成功。
- チーム（管理者/メンバー）
  - 期待: チーム名/地域/自己紹介/所属人数、今日/今後の大会カードが表示。
  - 確認: `GET /railway-teams/owner?as_user=<id>` と `GET /railway-teams/members?team_id=<id>` が成功。
  - 統計: `GET /railway-teams/stats?team_id=<id>` があれば、ポイント/フォロー/フォロワーが表示。
- 大会結果（個別/総合）
  - 期待: results全件がリストで表示（第一段階）。

## 3. よくある失敗と切り分け
- 401/403（認証関連）
  - JWTが無効/期限切れ。/login で再ログイン。`localStorage.JWT` の有無を確認。
- 404（エンドポイント未実装）
  - Railway API の新規ルートが未デプロイの場合（例: `/railway-teams/update`）。モックまたは回避策を利用。
  - 通知関連: `/railway-notifications/*` の未実装がある場合、バッジは0表示にフォールバック。
- CORS/ネットワーク不達
  - Vercel: 相対`/api`を使用しているか確認（絶対URLだとCORSの恐れ）。
  - Capacitor: `nodeApiUrl` がアプリ内設定で正しいか。
- SSE（通知）不達
  - `api.railwayNotifications.sseUrl()` が正しいURLを返すか確認。トークン付与・環境差に注意。

## 4. ログ/例外の見方
- フロント
  - ブラウザDevTools → Console / Network タブ
  - UI例外はアプリレベル ErrorBoundary（`src/components/ErrorBoundary.jsx`）で捕捉。再読み込みボタンあり。
- バックエンド
  - `backend/` 側のログ出力を確認。Vercel/Railwayのログダッシュボードも参照。

## 5. テスト観点（デザインを崩さず動的化）
- DOM構造/クラス名が変わっていないか
- プレースホルダーの置換が値のみになっているか（枠/色/余白は維持）
- ローディング/非該当メッセージの表示有無が適切か
- エラー時のUIが過度に主張しない（可能な限り既存レイアウト内に収める）

## 6. 手早い診断チェックリスト
- [ ] `.env.local` の `VITE_RAILWAY_DATA=true` / API URL の整合性
- [ ] コンソールに `Failed to load ...` / `CORS` / `401` が出ていない
- [ ] `localStorage.JWT` が存在
- [ ] ネットワークタブで対象APIが 2xx を返している
- [ ] ErrorBoundary の画面が出ない（出た場合はstackを確認）

## 7. 今後の改善（提案）
- API共通エラーUI（非モーダルの軽量トースト）
- 監視/トレーシング（Sentry等）
- SSE/WSの再接続とバックオフ実装
- チーム/検索/広告用のメタAPI整備

## 8. デバッグ画面
- ルート: `/#/debug`
- 表示内容:
  - ユーザー情報（id / JWT 長さ / サインアウト・JWT削除）
  - ランタイム設定（window.__APP_CONFIG__）
  - プラットフォーム（Capacitor / online 状態）
  - APIテスト（未読通知・大会検索）と再テストボタン
- 目的: フロント側の実行時コンテキストと基本API疎通の簡易確認
