# ReactアプリケーションのCapacitorによるアプリ化手順

## 前提条件
- Node.js（v14以上）がインストールされていること
- npmまたはyarnがインストールされていること
- Android Studio（Androidアプリ作成の場合）
- Xcode（iOSアプリ作成の場合、macOS環境必須）

## 1. プロジェクトのビルド

まず、Reactアプリケーションを本番用にビルドします。

```bash
npm run build
```

## 2. Capacitorのインストール

### 2.1 Capacitor CLIとコアパッケージのインストール

```bash
npm install @capacitor/core @capacitor/cli
```

### 2.2 Capacitorの初期化

```bash
npx cap init
```

以下の情報を入力します：
- **App name**: アプリケーション名（例：Anima Project）
- **App ID**: アプリケーションID（例：com.example.animaproject）
- **Web Directory**: ビルドディレクトリ（Viteの場合は `dist`）

## 3. プラットフォームの追加

### 3.1 iOSプラットフォームの追加

```bash
npm install @capacitor/ios
npx cap add ios
```

### 3.2 Androidプラットフォームの追加

```bash
npm install @capacitor/android
npx cap add android
```

## 4. capacitor.config.jsonの設定

`capacitor.config.json`ファイルを以下のように設定します：

```json
{
  "appId": "com.example.animaproject",
  "appName": "Anima Project",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}
```

## 5. ビルドとプラットフォームへの同期

### 5.1 プロジェクトのビルド

```bash
npm run build
```

### 5.2 Capacitorへの同期

```bash
npx cap sync
```

このコマンドは以下を実行します：
- Webアセットをネイティブプラットフォームにコピー
- Capacitorプラグインの更新
- ネイティブプロジェクトの設定を更新

## 6. ネイティブIDEでの開発

### 6.1 iOS（Xcode）

```bash
npx cap open ios
```

Xcodeが開いたら：
1. 署名設定を行う（Apple Developer Accountが必要）
2. シミュレーターまたは実機を選択
3. ▶️ボタンをクリックしてビルド・実行

### 6.2 Android（Android Studio）

```bash
npx cap open android
```

Android Studioが開いたら：
1. Gradle Syncが完了するまで待つ
2. エミュレーターまたは実機を選択
3. ▶️ボタンをクリックしてビルド・実行

## 7. 開発フロー

### 7.1 開発中の更新

開発中にWebアプリケーションを更新した場合：

```bash
# Reactアプリをビルド
npm run build

# 変更をネイティブプロジェクトに同期
npx cap sync

# または、コピーのみ（プラグインの更新がない場合）
npx cap copy
```

### 7.2 ライブリロード設定（開発用）

開発効率を上げるため、ライブリロードを設定できます：

1. `capacitor.config.json`を更新：

```json
{
  "appId": "com.example.animaproject",
  "appName": "Anima Project",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "url": "http://localhost:5173",
    "cleartext": true
  }
}
```

2. 開発サーバーを起動：

```bash
npm run dev
```

3. アプリを再ビルド：

```bash
npx cap sync
npx cap open ios  # または android
```

**注意**: 本番ビルド前に必ず`server`設定を削除してください。

## 8. プラグインの追加

Capacitorには多くの公式プラグインがあります：

```bash
# カメラ機能
npm install @capacitor/camera

# 位置情報
npm install @capacitor/geolocation

# ストレージ
npm install @capacitor/preferences

# プッシュ通知
npm install @capacitor/push-notifications
```

プラグインインストール後は必ず同期を実行：

```bash
npx cap sync
```

## 9. アプリアイコンとスプラッシュスクリーンの設定

### 9.1 必要な画像の準備

- **アイコン**: 1024x1024pxの正方形画像
- **スプラッシュスクリーン**: 2732x2732pxの正方形画像

### 9.2 @capacitor/assetsのインストール

```bash
npm install @capacitor/assets
```

### 9.3 アセットの生成

```bash
npx capacitor-assets generate
```

## 10. 本番ビルド

### 10.1 iOS

1. Xcodeで`Product` → `Archive`を選択
2. アーカイブ完了後、`Distribute App`を選択
3. App Store ConnectまたはAd Hocで配布

### 10.2 Android

1. Android Studioで`Build` → `Generate Signed Bundle / APK`を選択
2. 署名設定を行い、ビルドタイプを選択
3. APKまたはAABファイルを生成

## 11. トラブルシューティング

### よくある問題と解決方法

1. **ビルドエラー**: `npx cap sync`を実行して依存関係を更新
2. **白い画面**: `webDir`の設定が正しいか確認
3. **CORS エラー**: 開発時は`server`設定でローカルサーバーを指定
4. **プラグインが動作しない**: ネイティブ側の権限設定を確認

## 12. 参考リンク

- [Capacitor公式ドキュメント](https://capacitorjs.com/)
- [Capacitorプラグイン一覧](https://capacitorjs.com/docs/plugins)
- [Ionic Framework（UIコンポーネント）](https://ionicframework.com/)

## 次のステップ

1. 必要なCapacitorプラグインを追加
2. プラットフォーム固有の設定（権限、プッシュ通知等）
3. アプリストアへの申請準備

---

# このプロジェクト固有の設定と注意事項

## プロジェクト構造の特徴

このプロジェクトは以下の特徴があります：

### ルーティング設定
- React Router v6を使用したクライアントサイドルーティング
- 複数のスクリーン（Screen、Screen6-29等）を含む複雑な構造
- Unicode文字を含むパス名（日本語路径）が多数存在

### 静的ファイル構成
- `static/`ディレクトリに画像ファイルが配置
- SVG、PNG形式の画像を使用
- `_redirects`ファイルでSPAのルーティング対応

## Capacitor化における重要な修正点

### 1. ルーティング設定の修正

現在のプロジェクトは`createBrowserRouter`を使用していますが、Capacitorアプリでは以下の修正が必要です：

#### 1.1 App.jsxの修正

```jsx
import React from "react";
import { RouterProvider, createHashRouter } from "react-router-dom";
// createBrowserRouter から createHashRouter に変更

const router = createHashRouter([
  // 既存のルート設定をそのまま使用
  {
    path: "/*",
    element: <Screen />,
  },
  // ... 他のルート設定
]);

export const App = () => {
  return <RouterProvider router={router} />;
};
```

**理由**: ネイティブアプリでは`file://`プロトコルが使用されるため、BrowserRouterよりもHashRouterの方が確実に動作します。

#### 1.2 ベースパス設定の確認

`vite.config.js`の設定は既に正しく設定されています：

```javascript
export default defineConfig({
  plugins: [react()],
  publicDir: "./static",
  base: "./", // ← この設定が重要
});
```

### 2. 静的ファイルの処理

#### 2.1 画像パスの確認

プロジェクト内で画像を参照する際は、以下のパターンを使用してください：

```jsx
// 正しい画像の参照方法
<img src="./img/frame-18.svg" alt="frame" />

// または絶対パスで
<img src="/img/frame-18.svg" alt="frame" />
```

#### 2.2 _redirectsファイルの除外

Capacitorアプリでは`_redirects`ファイルは不要です。ビルド時に除外するか、以下のように`vite.config.js`を修正：

```javascript
export default defineConfig({
  plugins: [react()],
  publicDir: "./static",
  base: "./",
  build: {
    rollupOptions: {
      external: ['_redirects']
    }
  }
});
```

### 3. メタタグとマニフェスト設定

#### 3.1 index.htmlの修正

`index.html`に以下のメタタグを追加：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  
  <!-- Capacitor用の重要な設定 -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline'; object-src 'none'; " />
  <meta name="format-detection" content="telephone=no" />
  <meta name="msapplication-tap-highlight" content="no" />
  
  <title>Anima Project</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.jsx"></script>
</body>
</html>
```

### 4. 高度なCapacitor設定

#### 4.1 capacitor.config.jsonの最適化

```json
{
  "appId": "com.example.animaproject",
  "appName": "Anima Project",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "iosScheme": "capacitor"
  },
  "ios": {
    "contentInset": "automatic",
    "scrollEnabled": true
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#ffffff",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "default",
      "backgroundColor": "#ffffff"
    }
  }
}
```

#### 4.2 パフォーマンス最適化

```bash
# 必要に応じてパフォーマンス向上のプラグインを追加
npm install @capacitor/status-bar @capacitor/splash-screen
```

### 5. ビルドスクリプトの最適化

#### 5.1 package.jsonにCapacitor用スクリプトを追加

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:capacitor": "vite build && npx cap sync",
    "android": "npx cap open android",
    "ios": "npx cap open ios",
    "sync": "npx cap sync"
  }
}
```

### 6. 開発・デバッグ用設定

#### 6.1 Chrome DevToolsでのデバッグ

Android開発時は以下のURLでデバッグ可能：
```
chrome://inspect/#devices
```

#### 6.2 Safari Web Inspectorでのデバッグ（iOS）

iOS Simulatorでアプリを実行後、SafariのDeveloperメニューからデバッグ可能

### 7. 完璧な動作のためのチェックリスト

#### ビルド前チェック

- [ ] ルーティングをHashRouterに変更
- [ ] 画像パスが正しく設定されている
- [ ] index.htmlにCapacitor用メタタグを追加
- [ ] capacitor.config.jsonが正しく設定されている

#### テスト項目

- [ ] 全てのスクリーン間のナビゲーションが動作する
- [ ] 画像が正しく表示される
- [ ] タッチイベントが正しく動作する
- [ ] 回転時のレイアウトが適切
- [ ] スプラッシュスクリーンが表示される

#### リリース前チェック

- [ ] 本番ビルドでエラーが発生しない
- [ ] アプリアイコンが正しく設定されている
- [ ] 必要な権限が設定されている
- [ ] ストア申請用の情報が準備されている

## まとめ

このプロジェクトの特徴的な多画面構成とUnicode路径を持つルーティングシステムも、適切な設定により Capacitor で完璧に動作させることができます。特にHashRouterへの変更と静的ファイルの適切な処理が成功の鍵となります。