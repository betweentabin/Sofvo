# アプリストア審査要件チェックリスト

このドキュメントは、SofvoアプリをApple App StoreおよびGoogle Play Storeに提出する前に確認すべき要件をまとめたものです。

## 📋 目次
1. [法的文書](#法的文書)
2. [プライバシーとデータ保護](#プライバシーとデータ保護)
3. [アプリメタデータ](#アプリメタデータ)
4. [アイコンとグラフィック](#アイコンとグラフィック)
5. [機能とコンテンツ](#機能とコンテンツ)
6. [技術要件](#技術要件)
7. [テスト情報](#テスト情報)
8. [サポートとコンタクト](#サポートとコンタクト)

---

## 法的文書

### 現状
- ✅ プライバシーポリシーページ実装済み (`/privacy`)
- ✅ 利用規約ページ実装済み (`/terms`)
- ⚠️ **重大な問題**: 両方ともプレースホルダー（Xのコピペ）

### 必須対応
- [ ] **プライバシーポリシー（日本語）**: 法律家にレビューしてもらい、Sofvo固有の内容に書き換える
  - [ ] 収集する個人情報の種類を明記
  - [ ] データの利用目的を明記
  - [ ] 第三者共有について明記（Firebase、Cloudflare等）
  - [ ] データ保持期間を明記
  - [ ] ユーザーの権利（アクセス、削除、訂正）を明記
  - [ ] 問い合わせ先を明記

- [ ] **プライバシーポリシー（英語）**: 国際展開を考慮する場合

- [ ] **利用規約（日本語）**: 法律家にレビューしてもらい、Sofvo固有の内容に書き換える
  - [ ] サービスの説明
  - [ ] ユーザーの責任
  - [ ] 禁止事項
  - [ ] 知的財産権
  - [ ] 免責事項
  - [ ] サービス変更・終了の権利
  - [ ] 準拠法と管轄裁判所

- [ ] **利用規約（英語）**: 国際展開を考慮する場合

- [ ] **OSSライセンス表示ページ**: 使用しているオープンソースライブラリのライセンスリスト
  - 主な依存関係: React, React Router, Firebase, Capacitor等
  - アプリ内に表示するページを作成（設定画面からリンク）

### 推奨対応
- [ ] コミュニティガイドライン（ユーザー投稿がある場合）
- [ ] Cookieポリシー（Webビュー使用の場合）
- [ ] 児童プライバシーポリシー（13歳未満対応の場合）

---

## プライバシーとデータ保護

### iOS固有 (Info.plist)

#### 現状
- ❌ プライバシー関連の`NSUsageDescription`が不足

#### 必須対応
アプリがアクセスする可能性のある機能に対して、Info.plistに説明文を追加:

```xml
<!-- カメラ（プロフィール写真アップロード用） -->
<key>NSCameraUsageDescription</key>
<string>プロフィール写真を撮影するためにカメラへのアクセスが必要です</string>

<!-- フォトライブラリ（画像選択用） -->
<key>NSPhotoLibraryUsageDescription</key>
<string>プロフィール写真を選択するためにフォトライブラリへのアクセスが必要です</string>

<!-- 位置情報（マッチング機能用） -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>近くのユーザーとマッチングするために位置情報が必要です</string>

<!-- プッシュ通知 -->
<key>NSUserNotificationsUsageDescription</key>
<string>新しいマッチやメッセージの通知を受け取るために必要です</string>
```

#### App Privacy (App Store Connect)
- [ ] **データ収集の申告**: App Store Connectで詳細に記入
  - [ ] 個人を特定する情報: メールアドレス、ユーザーID
  - [ ] 連絡先情報: メールアドレス
  - [ ] ユーザーコンテンツ: プロフィール、投稿、写真
  - [ ] 識別子: ユーザーID、デバイスID
  - [ ] 使用状況データ: アプリ操作履歴
  - [ ] 診断データ: クラッシュログ（Firebase使用の場合）

- [ ] **データの使用目的**:
  - [ ] アプリ機能（マッチング、メッセージング）
  - [ ] 分析
  - [ ] アプリパフォーマンス改善

- [ ] **データとユーザーのリンク**: 該当する項目をチェック
- [ ] **トラッキング**: 第三者の広告やデータブローカーと共有するか明記

### Android固有

#### パーミッションの説明
現在のAndroidManifest.xml:
- ✅ `INTERNET` パーミッション: 宣言済み

追加が必要になる可能性のあるパーミッション:
```xml
<!-- カメラ -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- 写真アクセス (Android 13+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<!-- 写真アクセス (Android 12以下) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

<!-- 位置情報 -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- プッシュ通知 (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### Data Safety (Google Play Console)
- [ ] **データ収集の申告**: Google Play Consoleで詳細に記入
  - [ ] 個人情報: メールアドレス、名前
  - [ ] 写真と動画: プロフィール画像
  - [ ] アプリのアクティビティ: アプリ操作、検索履歴
  - [ ] アプリ情報とパフォーマンス: クラッシュログ、診断情報
  - [ ] デバイスまたはその他の ID

- [ ] **データの使用と共有**:
  - [ ] アプリ機能のため
  - [ ] 分析のため
  - [ ] 第三者との共有有無

- [ ] **データのセキュリティ**:
  - [ ] 転送時の暗号化（HTTPS）
  - [ ] データ削除リクエストの方法

### データ削除機能

#### 現状確認
- [ ] ユーザーがアカウント削除できる機能があるか確認
  - 現在の実装を確認する必要あり（設定画面から可能か？）

#### 必須対応
- [ ] **アカウント削除機能**:
  - [ ] 設定画面に「アカウント削除」ボタンを追加
  - [ ] 確認ダイアログを表示（誤操作防止）
  - [ ] バックエンドAPI実装（全データ削除）
  - [ ] 削除完了の確認メッセージ

- [ ] **データポータビリティ**:
  - [ ] ユーザーが自分のデータをエクスポートできる機能（推奨）
  - [ ] JSON/CSV形式でのダウンロード

---

## アプリメタデータ

### アプリ名とID

#### 現状
- ✅ アプリID: `com.sofvo.app`
- ✅ アプリ名: `Sofvo`

#### 確認事項
- [ ] アプリ名がストアで検索可能で覚えやすいか
- [ ] 商標問題がないか確認済みか
- [ ] 他のアプリと名前が被っていないか

### アプリ説明文

#### App Store（日本語）
- [ ] **アプリ名**: Sofvo（30文字以内）
- [ ] **サブタイトル**: 短い説明（30文字以内）
  - 例: 「理想のパートナーとつながる」
- [ ] **プロモーションテキスト**: 170文字以内（いつでも変更可能）
- [ ] **説明**: 4000文字以内
  - [ ] アプリの主要機能
  - [ ] ターゲットユーザー
  - [ ] 競合との差別化ポイント
  - [ ] 使い方の簡単な説明
- [ ] **キーワード**: 100文字以内（カンマ区切り）
  - 例: マッチング,恋活,婚活,出会い,デート

#### App Store（英語）
- [ ] 国際展開する場合は英語版も作成

#### Google Play（日本語）
- [ ] **アプリ名**: 30文字以内
- [ ] **簡単な説明**: 80文字以内
- [ ] **詳細な説明**: 4000文字以内
  - App Storeと同じ内容でOK

### カテゴリと対象年齢

#### App Store
- [ ] **プライマリカテゴリ**:
  - 推奨: ソーシャルネットワーキング or ライフスタイル
- [ ] **セカンダリカテゴリ**: （任意）
- [ ] **年齢制限**:
  - 推奨: 17+ （ユーザー生成コンテンツ、出会い系の要素があるため）
  - [ ] コンテンツレーティング質問票に回答

#### Google Play
- [ ] **カテゴリ**:
  - 推奨: ソーシャルネットワーク or ライフスタイル
- [ ] **コンテンツレーティング**: IARCレーティングを取得
  - [ ] IARC質問票に回答（性的コンテンツ、ユーザー間交流等）
  - 推奨: Teen (13+) または Mature 17+

### 価格と配信地域

- [ ] **価格**: 無料 or 有料
- [ ] **アプリ内課金**: 有無
  - [ ] ある場合、課金アイテムリストを作成
- [ ] **配信国**:
  - 初期: 日本のみ推奨
  - [ ] 海外展開の場合、各国の法規制を確認

---

## アイコンとグラフィック

### アプリアイコン

#### 現状
- ✅ iOS: AppIcon.appiconset に存在
- ✅ Android: 各密度のic_launcher存在

#### 確認事項
- [ ] **iOS要件**:
  - [ ] 1024x1024 px (App Store用)
  - [ ] 透過なし
  - [ ] 角丸なし（システムが自動適用）
  - [ ] アルファチャンネルなし

- [ ] **Android要件**:
  - [ ] mdpi (48x48), hdpi (72x72), xhdpi (96x96), xxhdpi (144x144), xxxhdpi (192x192)
  - [ ] 512x512 (Google Play用)
  - [ ] アダプティブアイコン対応（foreground + background）
  - [ ] フォアグラウンド: 安全領域考慮（中央の66%）

- [ ] **デザインガイドライン**:
  - [ ] 視認性が高い
  - [ ] シンプルで記憶に残る
  - [ ] ブランドカラーを使用
  - [ ] テキストを含まない（または最小限）

### スプラッシュスクリーン

#### 現状
- ✅ iOS: Splash.imageset に存在
- ✅ Android: 各密度のsplash.png存在
- ✅ Capacitor設定済み (capacitor.config.ts)

#### 確認事項
- [ ] 表示時間が適切（2秒 - 現在設定済み）
- [ ] ブランドロゴが中央に配置
- [ ] 背景色がブランドに合致（現在: #ffffff）

### スクリーンショット

#### App Store（iOS）
必須サイズ:
- [ ] **iPhone 6.9"** (iPhone 16 Pro Max): 1320 x 2868 px
  - または **iPhone 6.7"** (iPhone 14/15 Pro Max): 1290 x 2796 px
- [ ] **iPhone 6.1"** (iPhone 14/15 Pro): 1179 x 2556 px
- [ ] iPad Pro 13" (任意): 2048 x 2732 px

必須枚数:
- [ ] 最小3枚、最大10枚

内容:
- [ ] 主要機能を示す画面
- [ ] UI/UX の魅力を伝える
- [ ] 日本語のテキストを含む（ローカライズ）
- [ ] プライバシーに配慮（個人情報をぼかす）

推奨画面:
1. [ ] ホーム/フィード画面
2. [ ] プロフィール作成画面
3. [ ] マッチング画面
4. [ ] チャット/メッセージ画面
5. [ ] 設定/機能一覧

#### Google Play（Android）
必須サイズ:
- [ ] **Phone**: 最小2枚（推奨8枚）
  - 縦: 1080 x 1920 px 以上
  - 横: 1920 x 1080 px 以上

任意:
- [ ] 7インチタブレット
- [ ] 10インチタブレット

追加素材:
- [ ] **機能グラフィック**: 1024 x 500 px（Google Playトップページ用、必須）
- [ ] **プロモーション動画**: YouTube URL（任意、推奨）

---

## 機能とコンテンツ

### ユーザー生成コンテンツ (UGC)

#### 現状
アプリにはユーザー投稿機能がある:
- プロフィール情報
- 写真
- メッセージ
- 投稿

#### 必須対応
- [ ] **モデレーション機能**:
  - [ ] 不適切コンテンツの報告機能
  - [ ] ユーザーブロック機能
  - [ ] 管理者による削除機能

- [ ] **コンテンツポリシー**:
  - [ ] 禁止コンテンツの明記（暴力、ヘイト、性的コンテンツ等）
  - [ ] 利用規約に記載

- [ ] **年齢確認**:
  - [ ] 18歳未満の利用を制限する場合、生年月日入力を必須に
  - [ ] 年齢ゲート実装

### 出会い系/マッチング要素

#### Apple App Store要件
- [ ] **年齢制限**: 17+ に設定
- [ ] **安全機能**:
  - [ ] ユーザー報告機能
  - [ ] ブロック機能
  - [ ] 安全に関するヘルプページ

#### Google Play要件
- [ ] **デート要素の申告**:
  - Google Playにアプリがデート目的であることを申告
- [ ] **年齢制限**: Mature 17+ に設定
- [ ] **Content Rating質問票**:
  - 「ユーザー間の交流」「出会い/デート」項目に正直に回答

### プッシュ通知

#### 現状
- ✅ Capacitor Push Notifications プラグインインストール済み

#### 確認事項
- [ ] **iOS**: APNs証明書をApp Store Connectにアップロード
- [ ] **Android**: Firebase Cloud Messaging (FCM) 設定
- [ ] **通知の種類**:
  - [ ] マッチ通知
  - [ ] メッセージ通知
  - [ ] システム通知
- [ ] **オプトイン**: 初回起動時に許可を求める（説明を添えて）

---

## 技術要件

### iOS

#### 最小対応バージョン
- [ ] iOS 13.0以上（推奨: iOS 14.0以上）
- 現在のInfo.plistで確認・設定

#### 対応デバイス
- [ ] iPhone（必須）
- [ ] iPad（任意）
- [ ] 画面サイズに応じたレスポンシブデザイン

#### ビルド要件
- [ ] Xcode最新版でビルド
- [ ] Bitcodeオフ（Capacitorの推奨）
- [ ] テスト用証明書（Development）
- [ ] 配布用証明書（Distribution）
- [ ] プロビジョニングプロファイル

#### App Store Connect
- [ ] Apple Developer Program登録（年間12,980円）
- [ ] App Store Connect アプリ登録
- [ ] バンドルIDが一致（com.sofvo.app）

### Android

#### 最小対応バージョン
- [ ] minSdkVersion: 23（Android 6.0）以上推奨
- [ ] targetSdkVersion: 34（Android 14）以上（Google Play要件）
- build.gradleで確認・設定

#### 対応デバイス
- [ ] Phone（必須）
- [ ] Tablet（任意）

#### 署名
- [ ] リリース用キーストア作成
  ```bash
  keytool -genkey -v -keystore sofvo-release.keystore \
    -alias sofvo -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] android/app/build.gradle に署名設定追加
- [ ] キーストアを安全に保管（バックアップ必須）

#### Google Play Console
- [ ] Google Play Developer登録（$25一回払い）
- [ ] アプリ作成
- [ ] App Signing by Google Play 有効化（推奨）

### 共通

#### セキュリティ
- [ ] **HTTPS通信のみ**: すべてのAPI通信がHTTPS
  - Cloudflare Workers経由で実装済みか確認
- [ ] **APIキーの保護**: ソースコードにハードコードしない
  - 環境変数またはビルド時注入
- [ ] **認証トークン**: 安全に保存（Keychain/Keystore）
- [ ] **脆弱性スキャン**: 依存ライブラリのチェック
  ```bash
  npm audit
  ```

#### パフォーマンス
- [ ] **起動時間**: 3秒以内が理想
- [ ] **アプリサイズ**:
  - iOS: 50MB以下（セルラーダウンロード上限）
  - Android: 150MB以下（APK）、500MB以下（AAB）
- [ ] **メモリ使用量**: クラッシュしない程度に最適化

---

## テスト情報

### 審査用テストアカウント

#### 必須対応
- [ ] **テストユーザー作成**:
  - 最低2つのアカウント（マッチング機能をテストするため）
  - メールアドレス: test1@sofvo.app, test2@sofvo.app
  - パスワード: (審査用の仮パスワード)

- [ ] **App Store Connect / Play Console に記載**:
  ```
  テストアカウント1:
  Email: test1@sofvo.app
  Password: TestPass123!

  テストアカウント2:
  Email: test2@sofvo.app
  Password: TestPass123!

  ※ この2つのアカウントは既にマッチング済みです。
  メッセージ機能をテストする場合は、これらのアカウントでログインしてください。
  ```

- [ ] **テストデータ**:
  - プロフィール情報が入力済み
  - サンプル投稿がある
  - マッチ済みの状態

#### 審査メモ
- [ ] **特記事項**:
  ```
  - 位置情報はシミュレーターでも動作します
  - プッシュ通知は実機でのみテスト可能です
  - 初回起動時にログインが必要です
  ```

### TestFlight / 内部テスト

#### iOS (TestFlight)
- [ ] TestFlightにベータ版アップロード
- [ ] 社内テスターでテスト
- [ ] 外部テスター（友人など）でテスト
- [ ] フィードバック収集

#### Android (Internal Testing)
- [ ] Google Play Console の内部テストトラックにアップロード
- [ ] テスターリスト追加（メールアドレス）
- [ ] テスターに共有リンク送付
- [ ] フィードバック収集

---

## サポートとコンタクト

### 現状
- ✅ お問い合わせフォーム実装済み (`/contact`)

### 必須対応

#### サポートURL
- [ ] **公式ウェブサイト**:
  - [ ] Sofvoの紹介ページ（https://sofvo.app など）
  - [ ] アプリの機能説明
  - [ ] FAQ
  - [ ] プライバシーポリシー、利用規約へのリンク

- [ ] **サポートページ**:
  - [ ] ヘルプセンター（よくある質問）
  - [ ] トラブルシューティング
  - [ ] 使い方ガイド

#### サポートメールアドレス
- [ ] 専用メールアドレス: support@sofvo.app
- [ ] 自動返信設定
- [ ] 24-48時間以内の返信体制

#### App Store Connect / Play Console 記載事項
- [ ] **サポートURL**: https://sofvo.app/support
- [ ] **サポートメール**: support@sofvo.app
- [ ] **プライバシーポリシーURL**: https://sofvo.app/privacy
  - ⚠️ 現在は `/privacy` だが、本番環境の正式URLが必要
- [ ] **マーケティングURL**: https://sofvo.app

---

## チェックリスト提出前の最終確認

### 法務
- [ ] プライバシーポリシーが法律家によってレビューされた
- [ ] 利用規約が法律家によってレビューされた
- [ ] 会社情報（運営者名、住所、連絡先）が明記されている
- [ ] 特定商取引法に基づく表記（課金がある場合）

### 機能
- [ ] すべての主要機能が動作する
- [ ] クラッシュやバグがない
- [ ] ログイン/ログアウトが正常動作
- [ ] データの保存/読み込みが正常動作
- [ ] 画像アップロードが正常動作
- [ ] プッシュ通知が動作（実機テスト）

### デザイン
- [ ] すべての画面が iOS / Android デザインガイドラインに準拠
- [ ] ダークモード対応（任意だが推奨）
- [ ] 異なる画面サイズでテスト済み
- [ ] アクセシビリティ考慮（フォントサイズ、コントラスト）

### セキュリティ
- [ ] APIキーが環境変数化されている
- [ ] ユーザーデータが暗号化されている
- [ ] SQL injection対策済み
- [ ] XSS対策済み

### パフォーマンス
- [ ] 低速ネットワークでテスト済み
- [ ] オフライン動作の考慮
- [ ] 大量データでのテスト

---

## 重要度マトリクス

### 🔴 提出前必須（リジェクトリスク高）
1. プライバシーポリシー・利用規約の正式版
2. iOS NSUsageDescription の追加
3. App Privacy / Data Safety の正確な申告
4. テストアカウントの提供
5. サポート連絡先とURL
6. アプリアイコン（1024x1024）とスクリーンショット
7. 不適切コンテンツの報告/ブロック機能

### 🟡 推奨（ユーザー体験向上）
1. アカウント削除機能
2. データエクスポート機能
3. ダークモード対応
4. プロモーション動画
5. FAQ/ヘルプセンター
6. OSSライセンス表示

### 🟢 任意（余裕があれば）
1. 多言語対応
2. iPad最適化
3. ウィジェット機能
4. Apple Watch / Wear OS対応

---

## 提出後のフォロー

### 審査中
- [ ] App Store Connect / Play Console のメールを監視
- [ ] 審査チームからの質問に迅速に回答
- [ ] リジェクト理由を確認し、速やかに修正

### 承認後
- [ ] 段階的にリリース（Phased Release / Staged Rollout）を検討
- [ ] クラッシュレポートの監視（Firebase Crashlytics等）
- [ ] ユーザーレビューに返信
- [ ] アップデート計画（バグ修正、新機能）

---

## 参考リンク

### Apple
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)

### Google
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)
- [Material Design](https://material.io/design)
- [Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)

### Capacitor
- [iOS Configuration](https://capacitorjs.com/docs/ios/configuration)
- [Android Configuration](https://capacitorjs.com/docs/android/configuration)

---

**最終更新**: 2025-11-12
**ステータス**: 初回作成
