# プッシュ通知セットアップガイド

## 実装済み機能

✅ **完了した実装:**
1. Capacitorプッシュ通知プラグインのインストール
2. Supabaseデータベース設計（device_tokens, notification_settings）
3. プッシュ通知サービスクラス（pushNotification.js）
4. 通知ヘルパークラス（notificationHelper.js）
5. Supabase Edge Function（send-push-notification）
6. 通知設定画面の更新
7. App.jsxでの初期化処理

## 必要な追加設定

### 1. Firebase設定

#### 1.1 Firebaseプロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新規プロジェクトを作成（または既存のプロジェクトを使用）
3. プロジェクト名: `sofvo-app`（推奨）

#### 1.2 FCMサーバーキーの取得
1. プロジェクト設定 → クラウドメッセージング
2. 「サーバーキー」をコピー
3. Supabaseダッシュボードで環境変数として設定:
   ```
   FCM_SERVER_KEY=your-server-key-here
   ```

### 2. iOS設定

#### 2.1 必要なファイル
```bash
# GoogleService-Info.plistをダウンロードして配置
ios/App/GoogleService-Info.plist
```

#### 2.2 Xcode設定
1. Xcodeでプロジェクトを開く:
   ```bash
   npx cap open ios
   ```

2. Capabilities追加:
   - Push Notifications
   - Background Modes → Remote notifications

3. Info.plist更新:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
       <string>fetch</string>
       <string>remote-notification</string>
   </array>
   ```

#### 2.3 AppDelegate.swift更新
```swift
import UIKit
import Capacitor
import Firebase

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Firebase初期化
        FirebaseApp.configure()
        return true
    }

    // その他のデリゲートメソッド...
}
```

#### 2.4 APNs証明書
1. Apple Developer Centerで作成
2. Firebase Consoleにアップロード

### 3. Android設定

#### 3.1 必要なファイル
```bash
# google-services.jsonをダウンロードして配置
android/app/google-services.json
```

#### 3.2 build.gradle更新

**android/build.gradle:**
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

**android/app/build.gradle:**
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.1.2'
}
```

#### 3.3 AndroidManifest.xml更新
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<application>
    <!-- FCMサービス -->
    <service
        android:name="com.getcapacitor.plugins.pushnotifications.FCMService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>

    <!-- 通知アイコン設定 -->
    <meta-data
        android:name="com.google.firebase.messaging.default_notification_icon"
        android:resource="@drawable/ic_notification" />
    
    <!-- 通知カラー設定 -->
    <meta-data
        android:name="com.google.firebase.messaging.default_notification_color"
        android:resource="@color/colorPrimary" />
    
    <!-- 通知チャンネル -->
    <meta-data
        android:name="com.google.firebase.messaging.default_notification_channel_id"
        android:value="sofvo_default" />
</application>
```

### 4. Capacitor同期

設定完了後、以下のコマンドを実行:

```bash
# Capacitorの同期
npx cap sync

# iOSビルド
npx cap run ios

# Androidビルド
npx cap run android
```

### 5. Supabase設定

#### 5.1 データベーステーブルの作成
```bash
# Supabaseダッシュボードで実行
# または以下のファイルをSQL Editorで実行
supabase/add-device-tokens.sql
```

#### 5.2 Edge Functionのデプロイ
```bash
# Supabase CLIをインストール
npm install -g supabase

# ログイン
supabase login

# Edge Functionをデプロイ
supabase functions deploy send-push-notification
```

#### 5.3 環境変数の設定
Supabaseダッシュボード → Settings → Edge Functions → Secrets:
- `FCM_SERVER_KEY`: Firebaseのサーバーキー

### 6. テスト手順

#### 6.1 デバイスでのテスト
1. アプリをデバイスにインストール
2. 通知設定画面を開く
3. プッシュ通知を有効化
4. 権限を許可

#### 6.2 通知送信テスト
```javascript
// ブラウザコンソールまたはテストスクリプトで実行
import notificationHelper from './src/services/notificationHelper';

// テスト通知を送信
await notificationHelper.sendCustomNotification('user-id-here', {
  title: 'テスト通知',
  body: 'これはテスト通知です',
  type: 'news'
});
```

#### 6.3 確認項目
- [ ] デバイストークンが保存されているか
- [ ] 通知が届くか（フォアグラウンド）
- [ ] 通知が届くか（バックグラウンド）
- [ ] 通知タップで適切な画面に遷移するか
- [ ] 通知設定のON/OFFが反映されるか

### 7. トラブルシューティング

#### iOS
- **通知が届かない**: APNs証明書の確認、プロビジョニングプロファイルの更新
- **権限エラー**: Capabilitiesの設定確認
- **トークン取得失敗**: Firebase設定の確認

#### Android
- **通知が届かない**: google-services.jsonの配置確認
- **アイコンが表示されない**: drawable/ic_notificationの作成
- **音が鳴らない**: 通知チャンネルの設定確認

#### 共通
- **Edge Function エラー**: FCM_SERVER_KEYの設定確認
- **データベースエラー**: RLSポリシーの確認
- **トークン保存失敗**: ユーザー認証状態の確認

### 8. 本番環境への移行

1. **Firebase設定**
   - 本番用のFirebaseプロジェクト作成
   - 本番用の設定ファイル取得

2. **証明書更新**
   - 本番用のAPNs証明書作成
   - プロビジョニングプロファイル更新

3. **環境変数**
   - 本番用のFCMサーバーキー設定
   - Supabase本番環境の設定

4. **テスト**
   - ステージング環境でのテスト
   - 本番環境での動作確認

## 実装済みファイル一覧

```
/Users/kuwatataiga/Sofvo/
├── src/
│   ├── services/
│   │   ├── pushNotification.js      # プッシュ通知サービス
│   │   └── notificationHelper.js    # 通知ヘルパー
│   ├── screens/
│   │   └── 通知設定/Screen30.jsx    # 通知設定画面
│   └── App.jsx                      # 初期化処理
├── supabase/
│   ├── add-device-tokens.sql        # DBスキーマ
│   └── functions/
│       └── send-push-notification/  # Edge Function
│           └── index.ts
└── package.json                      # 依存関係
```

## 次のステップ

1. Firebaseプロジェクトを作成してFCMサーバーキーを取得
2. iOS/Android用の設定ファイルをダウンロードして配置
3. 各プラットフォーム固有の設定を完了
4. Supabaseに環境変数を設定
5. Edge Functionをデプロイ
6. 実機でテスト

プッシュ通知の基本実装は完了しています。上記の設定を行うことで、実際にデバイスで動作するようになります。