# Cloudflare Pages デプロイガイド

## セットアップ

### 1. Wranglerのインストール

```bash
npm install
```

### 2. Cloudflareへの認証

#### 方法A: OAuthログイン（推奨）

```bash
npx wrangler login
```

ブラウザが開き、Cloudflareアカウントでログインします。

#### 方法B: APIトークンを使用（OAuthが失敗する場合）

1. CloudflareダッシュボードでAPIトークンを生成：
   - https://dash.cloudflare.com/profile/api-tokens にアクセス
   - 「Create Token」をクリック
   - 「Edit Cloudflare Workers」テンプレートを使用
   - 権限に「Account:Cloudflare Pages:Edit」を追加
   - トークンを生成してコピー

2. 環境変数として設定：

```bash
export CLOUDFLARE_API_TOKEN=your_api_token_here
```

または、`.env`ファイルに追加：

```bash
CLOUDFLARE_API_TOKEN=your_api_token_here
```

3. デプロイ時に自動的に使用されます。

## デプロイ

### 初回デプロイ

初回はプロジェクトを作成してデプロイします：

```bash
npm run build
npx wrangler pages deploy dist --project-name=sofvo
```

### 通常のデプロイ

ビルドとデプロイを一度に実行：

```bash
npm run deploy
```

または、プレビューデプロイ：

```bash
npm run deploy:preview
```

## 設定

`wrangler.toml`ファイルでプロジェクト設定を管理しています。

- `name`: プロジェクト名
- `pages_build_output_dir`: ビルド出力ディレクトリ（`dist`）
- `compatibility_date`: Cloudflare Workersの互換性日付

## 注意事項

- `dist/_redirects`ファイルがSPA用に設定されています（`/* /index.html 200`）
- ビルド後に`dist`フォルダにデプロイされます
- 環境変数が必要な場合は、Cloudflare Pagesのダッシュボードで設定してください

## カスタムドメイン

Cloudflare Pagesのダッシュボードからカスタムドメインを設定できます。

