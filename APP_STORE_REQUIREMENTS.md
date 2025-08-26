# iOS/Android アプリストア公開要件チェックリスト

## 現在の状況

### ✅ 完了済み
- Capacitorプロジェクトの初期化
- iOS/Androidプラットフォームの追加
- HashRouterへの変更（ネイティブアプリ対応）
- ビルドファイルの生成

### ⚠️ 未完了（公開に必要）

## 1. アプリアイコン・スプラッシュスクリーン 🔴 必須

現在：デフォルトのCapacitorアイコンを使用中

**必要な作業：**
```bash
# 1. アイコン画像を準備（1024x1024px PNG）
# 2. スプラッシュスクリーン画像を準備（2732x2732px PNG）
# 3. 以下のコマンドで生成
npm install @capacitor/assets
npx capacitor-assets generate --iconOnly
npx capacitor-assets generate --splashOnly
```

## 2. アプリの権限設定 🔴 必須

現在：インターネット接続のみ許可

**必要に応じて追加すべき権限：**

### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<!-- カメラ（プロフィール画像撮影用） -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- プッシュ通知 -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- 位置情報（大会会場など） -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### iOS (`ios/App/App/Info.plist`)
```xml
<!-- カメラ -->
<key>NSCameraUsageDescription</key>
<string>プロフィール画像の撮影に使用します</string>

<!-- フォトライブラリ -->
<key>NSPhotoLibraryUsageDescription</key>
<string>プロフィール画像の選択に使用します</string>

<!-- 通知 -->
<key>NSUserNotificationsUsageDescription</key>
<string>大会情報やメッセージの通知を受け取るために使用します</string>

<!-- 位置情報 -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>大会会場の位置情報を表示するために使用します</string>
```

## 3. アプリ署名・証明書 🔴 必須

### Android
- [ ] keystoreファイルの生成
- [ ] `android/app/build.gradle`に署名設定を追加
- [ ] Google Play Consoleでアプリ登録

### iOS
- [ ] Apple Developer Programへの加入（$99/年）
- [ ] App IDの作成
- [ ] Provisioning Profileの作成
- [ ] Push Notification証明書の設定（必要な場合）

## 4. 本番用設定 🟡 重要

### 環境変数
- [ ] `.env.local`を`.env.production`にコピー
- [ ] 本番用のSupabase URLとキーを設定

### Capacitor設定
```json
// capacitor.config.json
{
  "server": {
    // 開発用設定を削除（現在は設定なし）
  }
}
```

## 5. アプリメタデータ 🟡 重要

### 両プラットフォーム共通
- [ ] アプリ名: Sofvo ✅
- [ ] アプリID: com.sofvo.app ✅
- [ ] バージョン番号: 1.0.0（要設定）
- [ ] アプリ説明文（日本語・英語）
- [ ] スクリーンショット（各サイズ5-10枚）
- [ ] プライバシーポリシーURL
- [ ] 利用規約URL
- [ ] サポートURL/メールアドレス

### App Store固有
- [ ] キーワード（100文字以内）
- [ ] プロモーションテキスト
- [ ] レーティング（年齢制限）設定

### Google Play固有
- [ ] 短い説明（80文字）
- [ ] 詳細な説明（4000文字）
- [ ] カテゴリ選択（スポーツ）
- [ ] コンテンツレーティング質問票

## 6. テスト要件 🟡 重要

- [ ] 各画面の動作確認
- [ ] Supabase接続テスト
- [ ] チャット機能のリアルタイム同期テスト
- [ ] 異なる画面サイズでのレイアウト確認
- [ ] オフライン時の動作確認

## 7. 法的要件 🔴 必須

- [ ] プライバシーポリシーの公開（画面は実装済み）
- [ ] 利用規約の公開（画面は実装済み）
- [ ] 特定商取引法に基づく表記（必要な場合）
- [ ] データ収集に関する説明

## 8. パフォーマンス最適化 🟡 推奨

- [ ] 画像の最適化（WebP形式の使用など）
- [ ] JSバンドルサイズの確認（現在: 327KB）
- [ ] 初回起動時間の最適化
- [ ] メモリ使用量の確認

## 優先度別対応項目

### 🔴 公開前に必須
1. アプリアイコンの設定
2. スプラッシュスクリーンの設定
3. 必要な権限の追加と説明文
4. アプリ署名（Android）/ 証明書（iOS）
5. プライバシーポリシー・利用規約の内容作成
6. Supabase本番環境の設定

### 🟡 推奨（UX向上）
1. プッシュ通知の実装
2. オフライン対応
3. アプリ内アップデート通知
4. クラッシュレポート設定（Firebase Crashlytics等）

### 🟢 将来的に検討
1. App Clipsの実装（iOS）
2. Instant Appsの実装（Android）
3. ウィジェット対応
4. ダークモード対応

## 次のステップ

1. **アイコン・スプラッシュスクリーンの作成**
   - デザイナーに依頼または自作
   - `capacitor-assets`で自動生成

2. **権限設定の追加**
   - 必要な機能を確認
   - AndroidManifest.xmlとInfo.plistを更新

3. **Supabase本番環境構築**
   - 本番用プロジェクト作成
   - 環境変数の設定

4. **テストビルド作成**
   - Android: APK/AABファイル生成
   - iOS: TestFlight用ビルド

5. **ストア申請準備**
   - スクリーンショット撮影
   - 説明文作成
   - メタデータ入力