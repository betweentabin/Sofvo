import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import api from '../services/api';

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.currentToken = null;
  }

  async initialize() {
    // Webプラットフォームではプッシュ通知をスキップ
    if (Capacitor.getPlatform() === 'web') {
      console.log('Push notifications not supported on web platform');
      return false;
    }

    try {
      // 既に初期化済みの場合はスキップ
      if (this.isInitialized) {
        return true;
      }

      // 権限をチェック
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        // 権限をリクエスト
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') {
          console.log('Push notification permission denied');
          return false;
        }
      } else if (permStatus.receive === 'denied') {
        console.log('Push notification permission denied');
        return false;
      }

      // 通知登録
      await PushNotifications.register();

      // リスナーを設定
      this.setupListeners();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  setupListeners() {
    // トークン取得リスナー
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      this.currentToken = token.value;
      await this.saveDeviceToken(token.value);
    });

    // 登録エラーリスナー
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ', error);
    });

    // 通知受信リスナー（フォアグラウンド）
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      this.handleForegroundNotification(notification);
    });

    // 通知タップリスナー
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed: ', notification);
      this.handleNotificationTap(notification);
    });
  }

  async saveDeviceToken(token) {
    try {
      const platform = Capacitor.getPlatform();
      const deviceInfo = await this.getDeviceInfo();
      try {
        await api.railwayNotifications.saveDeviceToken(token, platform, deviceInfo);
        console.log('Device token saved successfully');
      } catch (e) {
        console.error('Failed to save device token:', e);
      }
    } catch (error) {
      console.error('Error saving device token:', error);
    }
  }

  async getDeviceInfo() {
    try {
      const info = {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        // 追加のデバイス情報をここに追加可能
      };
      return info;
    } catch (error) {
      console.error('Error getting device info:', error);
      return {};
    }
  }

  async removeDeviceToken() {
    try {
      if (!this.currentToken) return;

      // Auth via JWT handled by axios interceptor
      await api.railwayNotifications.deleteDeviceToken(this.currentToken);
    } catch (error) {
      console.error('Error removing device token:', error);
    }
  }

  handleForegroundNotification(notification) {
    // フォアグラウンドで通知を受信した時の処理
    // アプリ内バナー表示など
    console.log('Foreground notification:', notification);
    
    // カスタムイベントを発火してUIコンポーネントに通知
    const event = new CustomEvent('push-notification-received', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  handleNotificationTap(notification) {
    // 通知をタップした時の処理
    const { data } = notification.notification;
    
    if (!data) return;

    // 通知タイプに応じて画面遷移
    switch(data.type) {
      case 'message':
        if (data.conversationId) {
          window.location.href = `/chat/${data.conversationId}`;
        }
        break;
      
      case 'tournament':
        if (data.tournamentId) {
          window.location.href = `/tournament/${data.tournamentId}`;
        }
        break;
      
      case 'team_invite':
        if (data.teamId) {
          window.location.href = `/team/${data.teamId}/invite`;
        }
        break;
      
      case 'news':
        window.location.href = '/notifications';
        break;
      
      default:
        window.location.href = '/notifications';
    }
  }

  async getNotificationSettings() {
    try {
      const { data } = await api.railwayNotifications.getSettings();
      if (!data) {
        // 設定が存在しない場合はデフォルト値を返す
        return {
          enabled: true,
          messages: true,
          tournaments: true,
          team_invites: true,
          news: true,
          sound: true,
          vibration: true
        };
      }
      return data;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  async updateNotificationSettings(settings) {
    try {
      await api.railwayNotifications.updateSettings(settings);

      // 通知が無効化された場合、デバイストークンも無効化
      if (!settings.enabled && this.currentToken) {
        await this.removeDeviceToken();
      }

      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  async requestPermission() {
    try {
      const permission = await PushNotifications.requestPermissions();
      return permission.receive === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  async getDeliveredNotifications() {
    try {
      const notificationList = await PushNotifications.getDeliveredNotifications();
      return notificationList.notifications;
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      return [];
    }
  }

  async removeAllDeliveredNotifications() {
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error removing delivered notifications:', error);
    }
  }

  async createChannel() {
    // Androidのみ: 通知チャンネルを作成
    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'sofvo_default',
        name: 'Sofvo通知',
        description: 'Sofvoアプリからの通知',
        importance: 4,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true
      });
    }
  }
}

// シングルトンインスタンスをエクスポート
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
