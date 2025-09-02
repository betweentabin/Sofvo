import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const Screen15 = () => {
  const { user } = useAuth();
  const [mainContentTop, setMainContentTop] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
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

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
                        {notification.type === 'system' ? 'Sofvo公式' : notification.title || '通知'}
                      </div>
                    </div>
                    <div className="text-wrapper-136">
                      {formatTimeAgo(notification.created_at)}
                    </div>
                  </div>

                  <div className="text-wrapper-137">
                    {notification.message || 'メッセージがありません'}
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
