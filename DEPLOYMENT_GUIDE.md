# Cloudflare Pages デプロイメントガイド

## 現在の状況

✅ **コードの実装**: 完了
✅ **GitHubへのプッシュ**: 完了（コミット: `dbe68e3`）
✅ **Cloudflare Pagesへのデプロイ**: 完了

**最新デプロイ情報（2025年11月29日）:**
- デプロイ方法: CLI（wrangler pages deploy）
- デプロイURL: https://1a43afb3.sofvo.pages.dev
- ビルド: vite v6.0.4
- アップロード: 2ファイル（98ファイルは既存）
- ステータス: ✨ デプロイ成功

---

## デプロイ状況の確認方法

### 1. Cloudflare Dashboard で確認

1. https://dash.cloudflare.com/ にログイン
2. **Pages** → **sofvo** を選択
3. **Deployments** タブをクリック
4. 最新のデプロイを確認:
   - ✅ **Success** になっていれば完了
   - 🟡 **Building** または **Deploying** であれば処理中
   - ❌ **Failed** の場合はログを確認

### 2. GitHubのコミットと紐付け確認

最新のデプロイが以下のコミットに対応しているか確認:
```
Commit: dbe68e3
Message: "Add tournament team participation and notification features"
```

このコミットがデプロイされていない場合、以下の手順で手動トリガーが必要です。

---

## 手動デプロイのトリガー方法

### オプション1: Cloudflare Dashboard から再デプロイ

1. Cloudflare Dashboard → **Pages** → **sofvo**
2. **Deployments** タブで最新のデプロイを見つける
3. 右側の **"..."** メニュー → **Retry deployment** をクリック

または

1. **Deployments** タブ
2. **Create deployment** ボタン
3. **Production branch** → **main** を選択
4. **Save and Deploy**

### オプション2: GitHub からデプロイをトリガー

1. GitHubリポジトリに移動
2. 空のコミットをプッシュ:
```bash
git commit --allow-empty -m "Trigger Cloudflare Pages deployment"
git push origin main
```

これにより、Cloudflare Pagesの自動デプロイが強制的にトリガーされます。

---

## デプロイ完了の確認

デプロイが完了したら、以下のコマンドでエンドポイントをテスト:

```bash
curl -s 'https://sofvo.pages.dev/api/railway-teams/my-teams?user_id=test'
```

### 成功時の応答例:
```json
[
  {
    "id": "team-uuid",
    "name": "チーム名",
    "user_role": "owner",
    "member_count": 5
  }
]
```

または空の配列:
```json
[]
```

### 失敗時の応答（現在の状態）:
```json
{"error":"Endpoint not found","path":"railway-teams/my-teams"}
```

---

## トラブルシューティング

### 問題1: デプロイが自動で開始されない

**原因**: GitHub Webhookの設定が無効または遅延
**解決策**:
1. Cloudflare Dashboard → **Pages** → **sofvo** → **Settings** → **Builds & deployments**
2. **Source** セクションで GitHub連携を確認
3. 必要に応じて **Disconnect** → **Reconnect** で再接続

### 問題2: デプロイが失敗する

**原因**: ビルドエラーまたは設定の問題
**解決策**:
1. **Deployments** タブでログを確認
2. エラーメッセージを確認:
   - ビルドエラー → `package.json` や依存関係を確認
   - 環境変数エラー → **Settings** → **Environment variables** を確認
   - D1バインディングエラー → **Settings** → **Functions** → **D1 database bindings** を確認

### 問題3: デプロイ成功後もエンドポイントが404

**原因**: Functions のビルド設定の問題
**確認**:
1. `wrangler.toml` の設定が正しいか:
   - `pages_build_output_dir = "dist"` ✅
   - D1バインディング設定 ✅
2. `functions` フォルダが正しくデプロイされているか
3. Cloudflare Dashboard → **Functions** タブで関数が表示されるか

---

## 次のステップ

1. **Cloudflare Dashboard でデプロイ状況を確認**
2. **必要に応じて手動デプロイをトリガー**
3. **デプロイ完了後、エンドポイントをテスト**
4. **すべてのテストを実行** (PRODUCTION_TEST_GUIDE.md参照)

---

## デプロイ待ち時間の目安

- 自動デプロイ: GitHubプッシュ後 **1〜5分**
- 手動デプロイ: トリガー後 **2〜10分**（プロジェクトサイズによる）

通常、Cloudflare Pagesは以下の手順でデプロイします:
1. **Initializing** (10秒)
2. **Cloning repository** (30秒)
3. **Building application** (1〜5分)
4. **Deploying to Cloudflare's network** (30秒)

---

## 現在の状態サマリー

- ✅ ローカル開発環境: 正常動作
- ✅ GitHubリポジトリ: 最新コミット反映済み
- ✅ Cloudflare Pages本番環境: デプロイ完了

**最新デプロイURL**: https://1a43afb3.sofvo.pages.dev

**推奨アクション**: デプロイされたアプリケーションの動作確認とテストを実施してください。
