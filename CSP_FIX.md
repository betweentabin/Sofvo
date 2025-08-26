# Content Security Policy (CSP) エラーの修正

## 問題
Capacitorアプリで以下のエラーが発生していました：
- Supabase APIへの接続がCSPによってブロック
- 外部スタイルシートの読み込みがブロック

## 解決方法

### 1. CSPヘッダーの更新
`index.html`のCSPメタタグを更新して、以下を許可しました：

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' data: gap: https://ssl.gstatic.com https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in;
  img-src 'self' data: https: blob:;
  object-src 'none';
" />
```

### 追加された許可内容：
- **Supabaseドメイン**: `https://*.supabase.co`, `https://*.supabase.in`
- **WebSocket接続**: `wss://*.supabase.co`, `wss://*.supabase.in`（リアルタイム機能用）
- **スタイルシート**: `https://fonts.googleapis.com`, `https://cdnjs.cloudflare.com`
- **フォント**: `https://fonts.gstatic.com`
- **画像**: すべてのHTTPS画像とblob URL

## ビルド後の確認

変更を適用するため、以下を実行してください：

```bash
# 1. プロジェクトをビルド
npm run build

# 2. iOSの場合
npx cap sync ios
npx cap open ios

# 3. Androidの場合
npx cap sync android
npx cap open android
```

## テスト項目
- ✅ ログイン機能が正常に動作すること
- ✅ Supabase APIへの接続が成功すること
- ✅ リアルタイムメッセージが受信できること
- ✅ 外部フォントが正しく読み込まれること

## 注意事項
- 本番環境では、より制限的なCSPポリシーを検討してください
- 特定のSupabaseプロジェクトURLのみを許可することを推奨します
- `'unsafe-inline'`と`'unsafe-eval'`は開発環境でのみ使用し、本番環境では可能な限り削除してください