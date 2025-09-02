import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import pushNotificationService from "../../services/pushNotification";
import { Capacitor } from '@capacitor/core';
import "./style.css";

export const Screen30 = () => {
  const [mainContentTop, setMainContentTop] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  // 通知設定の状態管理
  const [settings, setSettings] = useState({
    news: false,
    tournaments: false,
    team_invites: false,
    messages: false
  });

  // 設定を読み込む
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const notificationSettings = await pushNotificationService.getNotificationSettings();
      if (notificationSettings) {
        setSettings({
          news: notificationSettings.news,
          tournaments: notificationSettings.tournaments,
          team_invites: notificationSettings.team_invites,
          messages: notificationSettings.messages
        });
        setPushEnabled(notificationSettings.enabled);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setIsLoading(false);
    }
  };

  // プッシュ通知の有効/無効を切り替え
  const togglePushNotifications = async () => {
    // Webプラットフォームではプッシュ通知を使用しない
    if (Capacitor.getPlatform() === 'web') {
      alert('プッシュ通知はモバイルアプリでのみ利用可能です');
      return;
    }

    try {
      if (!pushEnabled) {
        // 権限をリクエスト
        const granted = await pushNotificationService.requestPermission();
        if (granted) {
          await pushNotificationService.initialize();
          setPushEnabled(true);
          await saveSettings({ ...settings, enabled: true });
        } else {
          setShowPermissionAlert(true);
        }
      } else {
        // 通知を無効化
        setPushEnabled(false);
        await saveSettings({ ...settings, enabled: false });
        await pushNotificationService.removeDeviceToken();
      }
    } catch (error) {
      console.error('Failed to toggle push notifications:', error);
    }
  };

  // 個別の通知設定を切り替え
  const toggleSetting = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(newSettings);
    await saveSettings({ ...newSettings, enabled: pushEnabled });
  };

  // 設定を保存
  const saveSettings = async (newSettings) => {
    try {
      await pushNotificationService.updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  useEffect(() => {
    const updateMainContentPosition = () => {
      const header = document.querySelector(".header-content-outer");
      if (header) {
        const rect = header.getBoundingClientRect();
        setMainContentTop(rect.bottom);
      }
    };

    setTimeout(updateMainContentPosition, 200);
    window.addEventListener("resize", updateMainContentPosition);
    return () => window.removeEventListener("resize", updateMainContentPosition);
  }, []);

  return (
    <div className="screen-30">
      <HeaderContent />
      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="screen-30">
          <div className="frame-439">
            <div className="frame-440">
              <div className="frame-466">
                <div className="text-wrapper-226">通知設定</div>
              </div>

              <div className="frame-441">
                {/* プッシュ通知のマスター設定（モバイルのみ表示） */}
                {Capacitor.getPlatform() !== 'web' && (
                  <div className="frame-442" style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
                    <div className="frame-443">
                      <div className="text-wrapper-216" style={{ fontWeight: 'bold' }}>プッシュ通知</div>
                    </div>
                    <button
                      className={`toggle-switch ${pushEnabled ? "on" : "off"}`}
                      onClick={togglePushNotifications}
                      aria-pressed={pushEnabled}
                      aria-label="プッシュ通知の有効/無効"
                      type="button"
                      disabled={isLoading}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
                )}

                {/* 個別の通知設定 */}
                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">お知らせ</div>
                  </div>
                  <button
                    className={`toggle-switch ${settings.news ? "on" : "off"}`}
                    onClick={() => toggleSetting('news')}
                    aria-pressed={settings.news}
                    aria-label="お知らせ通知設定"
                    type="button"
                    disabled={isLoading || (!pushEnabled && Capacitor.getPlatform() !== 'web')}
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>

                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">大会開催通知</div>
                  </div>
                  <button
                    className={`toggle-switch ${settings.tournaments ? "on" : "off"}`}
                    onClick={() => toggleSetting('tournaments')}
                    aria-pressed={settings.tournaments}
                    aria-label="大会通知設定"
                    type="button"
                    disabled={isLoading || (!pushEnabled && Capacitor.getPlatform() !== 'web')}
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>

                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">チーム招待</div>
                  </div>
                  <button
                    className={`toggle-switch ${settings.team_invites ? "on" : "off"}`}
                    onClick={() => toggleSetting('team_invites')}
                    aria-pressed={settings.team_invites}
                    aria-label="チーム招待通知設定"
                    type="button"
                    disabled={isLoading || (!pushEnabled && Capacitor.getPlatform() !== 'web')}
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>

                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">メッセージ</div>
                  </div>
                  <button
                    className={`toggle-switch ${settings.messages ? "on" : "off"}`}
                    onClick={() => toggleSetting('messages')}
                    aria-pressed={settings.messages}
                    aria-label="メッセージ通知設定"
                    type="button"
                    disabled={isLoading || (!pushEnabled && Capacitor.getPlatform() !== 'web')}
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>
              </div>

              {/* 権限拒否時のアラート */}
              {showPermissionAlert && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  margin: '16px',
                  fontSize: '14px'
                }}>
                  プッシュ通知を有効にするには、デバイスの設定から通知を許可してください。
                  <button 
                    onClick={() => setShowPermissionAlert(false)}
                    style={{ marginLeft: '10px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer currentPage="team-create" />
    </div>
  );
};
