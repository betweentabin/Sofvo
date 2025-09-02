# プッシュ通知実装ガイド - Sofvo

## 📱 概要
SofvoアプリケーションにiOS/Androidデバイスへのプッシュ通知機能を実装するための包括的なガイドです。メッセージ受信、お知らせ、大会通知などをリアルタイムでユーザーのデバイスに配信します。

## 🏗️ 現在の実装状況

### ✅ 実装済み
- **データベース**: notificationsテーブル（Supabase）
- **バックエンドAPI**: 通知CRUD操作（Express.js）
- **フロントエンド**: 通知画面UI（React）
- **モバイルフレームワーク**: Capacitor設定済み
- **リアルタイム**: Supabase Realtime購読機能

### ❌ 未実装
- プッシュ通知サービス統合（FCM/APNs）
- デバイストークン管理
- 通知権限リクエスト
- バックグラウンド通知処理
- 通知のカスタマイズ（音、バッジ、アイコン）

## 🔧 必要な実装内容

### 1. Firebase Cloud Messaging (FCM) セットアップ

#### 1.1 Firebaseプロジェクト作成
```bash
# Firebase CLIインストール
npm install -g firebase-tools

# Firebaseログイン
firebase login

# プロジェクト初期化
firebase init
```

#### 1.2 必要なパッケージインストール
```bash
# Capacitorプッシュ通知プラグイン
npm install @capacitor/push-notifications

# Firebase SDK
npm install firebase
```

#### 1.3 設定ファイル追加
**google-services.json（Android）**
- Firebaseコンソールからダウンロード
- `android/app/`に配置

**GoogleService-Info.plist（iOS）**
- Firebaseコンソールからダウンロード
- `ios/App/`に配置

### 2. iOS固有の設定

#### 2.1 Apple Developer設定
- **Push Notification Capability**有効化
- **APNs証明書**作成とアップロード
- **プロビジョニングプロファイル**更新

#### 2.2 Info.plist設定
```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

#### 2.3 Xcodeプロジェクト設定
```swift
// AppDelegate.swift
import Firebase
import UserNotifications

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, 
                    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        UNUserNotificationCenter.current().delegate = self
        return true
    }
}
```

### 3. Android固有の設定

#### 3.1 build.gradle設定
```gradle
// android/build.gradle
dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
}

// android/app/build.gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.1.2'
}
```

#### 3.2 AndroidManifest.xml設定
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<service
    android:name="com.getcapacitor.plugins.pushnotifications.FCMService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### 4. フロントエンド実装

#### 4.1 プッシュ通知サービス作成
```javascript
// src/services/pushNotification.js
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';

class PushNotificationService {
  async initialize() {
    // 権限リクエスト
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      // 通知登録
      await PushNotifications.register();
    }
    
    // リスナー設定
    this.setupListeners();
  }

  setupListeners() {
    // トークン取得
    PushNotifications.addListener('registration', async (token) => {
      await this.saveDeviceToken(token.value);
    });

    // 通知受信（フォアグラウンド）
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('通知受信:', notification);
      this.handleNotification(notification);
    });

    // 通知タップ
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('通知タップ:', action);
      this.handleNotificationAction(action);
    });
  }

  async saveDeviceToken(token) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // device_tokensテーブルに保存
    await supabase
      .from('device_tokens')
      .upsert({
        user_id: user.id,
        token: token,
        platform: this.getPlatform(),
        updated_at: new Date().toISOString()
      });
  }

  getPlatform() {
    const { Capacitor } = window;
    return Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
  }

  handleNotification(notification) {
    // アプリ内通知表示
    this.showInAppNotification(notification);
    
    // 未読カウント更新
    this.updateUnreadCount();
  }

  handleNotificationAction(action) {
    const { notification, actionId } = action;
    
    // 通知タイプによる画面遷移
    switch(notification.data?.type) {
      case 'message':
        this.navigateToChat(notification.data.conversationId);
        break;
      case 'tournament':
        this.navigateToTournament(notification.data.tournamentId);
        break;
      case 'team_invite':
        this.navigateToTeamInvite(notification.data.teamId);
        break;
      default:
        this.navigateToNotifications();
    }
  }
}

export default new PushNotificationService();
```

#### 4.2 App.jsxへの統合
```javascript
// src/App.jsx
import { useEffect } from 'react';
import pushNotificationService from './services/pushNotification';

function App() {
  useEffect(() => {
    // アプリ起動時に初期化
    pushNotificationService.initialize();
  }, []);
  
  // ...
}
```

### 5. バックエンド実装

#### 5.1 デバイストークンテーブル作成
```sql
-- supabase/schema.sql に追加
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- RLSポリシー
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device tokens" ON public.device_tokens
  FOR ALL USING (auth.uid() = user_id);
```

#### 5.2 通知送信サービス
```javascript
// backend/src/services/pushNotification.service.js
import admin from 'firebase-admin';
import { supabase } from '../config/supabase.js';

// Firebase Admin SDK初期化
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

class PushNotificationService {
  async sendToUser(userId, notification) {
    // ユーザーのデバイストークン取得
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!tokens || tokens.length === 0) return;

    // 各トークンに送信
    const messages = tokens.map(device => ({
      token: device.token,
      notification: {
        title: notification.title,
        body: notification.message,
        badge: notification.badge?.toString()
      },
      data: {
        type: notification.type,
        ...notification.data
      },
      // プラットフォーム別設定
      ...(device.platform === 'ios' ? {
        apns: {
          payload: {
            aps: {
              sound: 'default',
              'content-available': 1
            }
          }
        }
      } : {}),
      ...(device.platform === 'android' ? {
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default'
          }
        }
      } : {})
    }));

    // バッチ送信
    const response = await admin.messaging().sendAll(messages);
    
    // 失敗したトークンを無効化
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
        this.deactivateToken(tokens[idx].token);
      }
    });

    return response;
  }

  async deactivateToken(token) {
    await supabase
      .from('device_tokens')
      .update({ is_active: false })
      .eq('token', token);
  }

  // 通知タイプ別送信メソッド
  async sendMessageNotification(userId, message, senderName) {
    return this.sendToUser(userId, {
      title: `${senderName}からメッセージ`,
      message: message.content,
      type: 'message',
      data: {
        conversationId: message.conversation_id,
        messageId: message.id
      }
    });
  }

  async sendTournamentNotification(userId, tournament, notificationType) {
    const titles = {
      'registration_open': '大会参加受付開始',
      'registration_closing': '大会参加締切間近',
      'tournament_start': '大会開始のお知らせ',
      'result_published': '大会結果発表'
    };

    return this.sendToUser(userId, {
      title: titles[notificationType],
      message: `${tournament.name}の${titles[notificationType]}`,
      type: 'tournament',
      data: {
        tournamentId: tournament.id,
        notificationType
      }
    });
  }

  async sendTeamInviteNotification(userId, team, inviterName) {
    return this.sendToUser(userId, {
      title: 'チーム招待',
      message: `${inviterName}さんから${team.name}への招待が届いています`,
      type: 'team_invite',
      data: {
        teamId: team.id,
        inviterName
      }
    });
  }
}

export default new PushNotificationService();
```

#### 5.3 通知トリガー実装
```javascript
// backend/src/triggers/notification.triggers.js
import pushNotificationService from '../services/pushNotification.service.js';

// メッセージ送信時のトリガー
export async function onMessageCreated(message) {
  // 会話の参加者取得
  const participants = await getConversationParticipants(message.conversation_id);
  
  // 送信者以外に通知
  for (const participant of participants) {
    if (participant.user_id !== message.sender_id) {
      await pushNotificationService.sendMessageNotification(
        participant.user_id,
        message,
        message.sender_name
      );
    }
  }
}

// 大会作成時のトリガー
export async function onTournamentCreated(tournament) {
  // フォロワーに通知
  const followers = await getOrganizerFollowers(tournament.organizer_id);
  
  for (const follower of followers) {
    await pushNotificationService.sendTournamentNotification(
      follower.user_id,
      tournament,
      'registration_open'
    );
  }
}
```

### 6. 通知設定画面の実装

```javascript
// src/screens/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';

export const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    messages: true,
    tournaments: true,
    teamInvites: true,
    news: true,
    sound: true,
    vibration: true
  });

  const toggleNotifications = async () => {
    if (!settings.enabled) {
      // 権限リクエスト
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') {
        await PushNotifications.register();
        setSettings({ ...settings, enabled: true });
      }
    } else {
      // 通知無効化（トークン削除）
      await disableNotifications();
      setSettings({ ...settings, enabled: false });
    }
  };

  return (
    <div className="notification-settings">
      <h2>通知設定</h2>
      
      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={toggleNotifications}
          />
          プッシュ通知を有効にする
        </label>
      </div>

      {settings.enabled && (
        <>
          <h3>通知タイプ</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.messages}
                onChange={(e) => setSettings({...settings, messages: e.target.checked})}
              />
              メッセージ
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.tournaments}
                onChange={(e) => setSettings({...settings, tournaments: e.target.checked})}
              />
              大会のお知らせ
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.teamInvites}
                onChange={(e) => setSettings({...settings, teamInvites: e.target.checked})}
              />
              チーム招待
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.news}
                onChange={(e) => setSettings({...settings, news: e.target.checked})}
              />
              Sofvoからのお知らせ
            </label>
          </div>

          <h3>通知方法</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => setSettings({...settings, sound: e.target.checked})}
              />
              通知音
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.vibration}
                onChange={(e) => setSettings({...settings, vibration: e.target.checked})}
              />
              バイブレーション
            </label>
          </div>
        </>
      )}
    </div>
  );
};
```

## 📋 実装チェックリスト

### 準備
- [ ] Firebaseプロジェクト作成
- [ ] Apple Developer Accountでプッシュ通知設定
- [ ] google-services.json取得（Android）
- [ ] GoogleService-Info.plist取得（iOS）
- [ ] APNs証明書作成とアップロード

### パッケージインストール
- [ ] @capacitor/push-notifications
- [ ] firebase
- [ ] firebase-admin（バックエンド）

### データベース
- [ ] device_tokensテーブル作成
- [ ] RLSポリシー設定
- [ ] notification_settingsテーブル作成

### フロントエンド
- [ ] プッシュ通知サービス実装
- [ ] 権限リクエストUI
- [ ] 通知設定画面
- [ ] アプリ内通知表示
- [ ] 通知タップハンドリング

### バックエンド
- [ ] Firebase Admin SDK設定
- [ ] デバイストークン管理API
- [ ] 通知送信サービス
- [ ] 通知トリガー実装
- [ ] バッチ送信最適化

### iOS設定
- [ ] Capabilities追加
- [ ] Info.plist更新
- [ ] AppDelegate設定
- [ ] プロビジョニングプロファイル更新

### Android設定
- [ ] build.gradle設定
- [ ] AndroidManifest.xml更新
- [ ] 通知チャンネル設定
- [ ] アイコン・色設定

### テスト
- [ ] iOS実機テスト
- [ ] Android実機テスト
- [ ] バックグラウンド通知テスト
- [ ] 通知タップテスト
- [ ] トークン更新テスト

## 🔐 セキュリティ考慮事項

1. **トークン管理**
   - 定期的なトークン更新
   - 無効トークンの自動削除
   - ユーザーごとのトークン数制限

2. **プライバシー**
   - 通知内容の暗号化
   - センシティブ情報の非表示
   - ユーザー設定の尊重

3. **レート制限**
   - 送信頻度の制限
   - スパム防止
   - 優先度管理

## 📊 モニタリング

1. **配信メトリクス**
   - 配信成功率
   - 開封率
   - エラー率

2. **パフォーマンス**
   - 送信遅延
   - バッチ処理効率
   - トークン更新頻度

3. **ユーザーエンゲージメント**
   - 通知からのアプリ起動率
   - 通知設定の有効化率
   - 通知タイプ別の反応率

## 🚀 段階的実装プラン

### Phase 1: 基本実装（1-2週間）
- Firebase設定
- 基本的な通知送受信
- デバイストークン管理

### Phase 2: 機能拡張（1週間）
- 通知タイプ別処理
- アプリ内通知表示
- 通知設定画面

### Phase 3: 最適化（1週間）
- バッチ送信
- エラーハンドリング
- パフォーマンス最適化

### Phase 4: 高度な機能（オプション）
- リッチ通知（画像、アクション）
- 通知のグループ化
- 静音時間設定
- A/Bテスト機能

## 📚 参考資料

- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Android Notifications](https://developer.android.com/develop/ui/views/notifications)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)