import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const Screen15 = () => {
  const { user } = useAuth();
  const mainContentTop = useHeaderOffset();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.railwayNotifications.list(50, 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.railwayNotifications.markRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Format time difference
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}日前`;
    } else if (diffInHours > 0) {
      return `${diffInHours}時間前`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}分前`;
    } else {
      return 'たった今';
    }
  };

  
  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // SSE realtime subscription (Railway)
  useEffect(() => {
    if (!user) return;
    const url = api.railwayNotifications.sseUrl(user.id);
    const es = new EventSource(url);
    es.addEventListener('notification', (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setNotifications(prev => [data, ...prev]);
      } catch {}
    });
    return () => es.close();
  }, [user]);

  return (
    <div className="screen-15">
      <HeaderContent />
    <div
      className="main-content"
      style={{
        position: "absolute",
        top: `${mainContentTop}px`,
        bottom: "60px", // フッター高さ
        overflowY: "auto",
        width: "100%",
      }}
    >
      <div className="screen-15">
        <div className="frame-259">
          <div className="frame-261">

            <div className="frame-262">
              <div className="text-wrapper-134">通知</div>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  className="frame-260" 
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  style={{ 
                    cursor: 'pointer',
                    opacity: notification.read ? 0.7 : 1,
                    backgroundColor: notification.read ? 'transparent' : '#f0f8ff'
                  }}
                >
                  <div className="frame-257">
                    <div className="frame-263">
                      <div className="frame-264" />
                      <div className="text-wrapper-135">
                        {notification.type === 'tournament_reminder' ? '大会のお知らせ' :
                         notification.type === 'match_schedule' ? '対戦表発表' :
                         notification.type === 'system' ? 'Sofvo公式' :
                         notification.title || '通知'}
                      </div>
                    </div>
                    <div className="text-wrapper-136">
                      {formatTimeAgo(notification.created_at)}
                    </div>
                  </div>

                  <div className="text-wrapper-137">
                    {notification.content || notification.message || 'メッセージがありません'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                通知はありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <Footer currentPage="notifications" />
  </div>
  );
};
