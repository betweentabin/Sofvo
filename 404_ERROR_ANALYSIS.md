# 404エラー原因分析レポート

## 問題の概要

各ページ遷移時に404エラーが発生しているとのことですが、実際には**ページ遷移自体は成功**しており、**APIリクエストが404エラー**を返しています。

## 原因分析

### 1. ページ遷移自体は正常

**確認事項：**
- `createHashRouter`を使用しているため、URLは`/#/home`のような形式
- ハッシュルーティング（`#`以降）はブラウザ側で処理されるため、サーバー側のリダイレクトは不要
- `_redirects`ファイルは正しく設定されている（`/* /index.html 200`）
- `dist/_redirects`ファイルも存在している

**結論：** ページ遷移自体は正常に動作しています。

### 2. 実際の404エラーの原因

**重要な発見：** `functions/api/[[path]].js`を確認したところ、**エンドポイントは既に実装されています**！

#### 実装されているエンドポイント
- ✅ `railway-posts/latest` (275行目)
- ✅ `railway-posts/create` (293行目)
- ✅ `railway-home/following` (323行目)
- ✅ `railway-users/profile` (170行目)
- ✅ `railway-home/recommended-diaries` (353行目)
- ✅ `railway-tournaments/search` (375行目)
- ✅ `railway-meta` (418行目)
- ✅ `railway-chat/conversations` (437行目)

#### しかし、404エラーが発生している理由

**考えられる原因：**

1. **Cloudflare Pages Functionsがデプロイされていない**
   - `functions`フォルダがデプロイに含まれていない可能性
   - `wrangler pages deploy dist`コマンドで`functions`フォルダがデプロイされていない

2. **Cloudflare Pagesの設定問題**
   - Functionsが有効になっていない
   - D1データベースの接続設定が正しくない

3. **パスのマッチング問題**
   - `[[path]]`のパスパラメータが正しく取得できていない
   - パスの比較ロジックに問題がある可能性

4. **D1データベースのテーブルが存在しない**
   - `posts`テーブルが存在しない場合、SQLエラーが発生する可能性
   - エラーハンドリングで500エラーではなく404が返されている可能性

### 3. 確認すべきポイント

#### デプロイ設定の確認
```bash
# 現在のデプロイコマンド
npm run deploy  # → npm run build && wrangler pages deploy dist
```

**問題点：** `wrangler pages deploy dist`は`dist`フォルダのみをデプロイしますが、`functions`フォルダは`dist`の外にあるため、デプロイされていない可能性があります。

#### Cloudflare Pages Functionsのデプロイ方法

Cloudflare Pages Functionsは、プロジェクトルートの`functions`フォルダから自動的にデプロイされます。しかし、`wrangler pages deploy dist`コマンドを使用する場合、`functions`フォルダがデプロイに含まれない可能性があります。

**正しいデプロイ方法：**
```bash
# 方法1: プロジェクトルートからデプロイ（推奨）
wrangler pages deploy dist --project-name=sofvo

# 方法2: functionsフォルダを明示的に指定
wrangler pages deploy . --project-name=sofvo
```

## 解決方法

### 🔴 原因：デプロイコマンドの問題

**現在のデプロイコマンド：**
```json
"deploy": "npm run build && wrangler pages deploy dist"
```

**問題点：**
- `wrangler pages deploy dist`は`dist`フォルダのみをデプロイ
- `functions`フォルダはプロジェクトルートにあるため、デプロイに含まれていない
- そのため、APIエンドポイントが404エラーを返している

### 方法1: デプロイコマンドの修正（推奨）

`package.json`のデプロイスクリプトを修正：

**オプションA: プロジェクトルートからデプロイ**
```json
{
  "scripts": {
    "deploy": "npm run build && wrangler pages deploy . --project-name=sofvo"
  }
}
```

**オプションB: functionsフォルダをdistにコピー**
```json
{
  "scripts": {
    "build": "vite build && cp -r functions dist/",
    "deploy": "npm run build && wrangler pages deploy dist --project-name=sofvo"
  }
}
```

**オプションC: wrangler.tomlの設定を確認**
`wrangler.toml`に`pages_build_output_dir = "dist"`が設定されている場合、プロジェクトルートからデプロイすると自動的に`dist`と`functions`の両方がデプロイされます。

### 方法2: Cloudflare Pagesダッシュボードでの確認

1. Cloudflare Pagesダッシュボードにアクセス
2. プロジェクト設定を確認
3. Functionsが有効になっているか確認
4. D1データベースの接続設定を確認

### 方法3: デプロイログの確認

デプロイ時のログを確認して、`functions`フォルダがデプロイに含まれているか確認：

```bash
npm run deploy -- --verbose
```

## 確認手順

1. **ローカルでの動作確認**
   ```bash
   npx wrangler pages dev dist
   ```
   これでローカルでFunctionsが動作するか確認できます。

2. **デプロイ後の確認**
   - Cloudflare PagesダッシュボードでFunctionsが表示されているか確認
   - 実際のAPIリクエストを送信してレスポンスを確認

3. **ログの確認**
   - Cloudflare Pagesダッシュボードのログを確認
   - エラーメッセージを確認

## 次のステップ

1. **デプロイコマンドの修正**
2. **再デプロイ**
3. **動作確認**

## 参考情報

- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/platform/functions/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- D1 Database: https://developers.cloudflare.com/d1/
