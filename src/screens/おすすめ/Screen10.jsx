import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Screen10 = () => {
  const mainContentTop = useHeaderOffset();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedUsers();
  }, [user?.id]);

  const fetchRecommendedUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.railwayUsers.getRecommended(user?.id, 20);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching recommended users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/mypage/${userId}`);
  };

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) {
      return '/img/default-avatar.png';
    }
    return avatarUrl;
  };

  return (
    <div className="screen-10">
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
        <div className="recommend-header">
          <h2 className="recommend-title">おすすめのユーザー</h2>
        </div>

        {loading ? (
          <div className="loading-container">
            <p>読み込み中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-container">
            <p>おすすめのユーザーがいません</p>
          </div>
        ) : (
          <div className="users-list">
            {users.map((recommendedUser) => (
              <div
                key={recommendedUser.id}
                className="user-card"
                onClick={() => handleUserClick(recommendedUser.id)}
              >
                <div className="user-info">
                  <div
                    className="user-avatar"
                    style={{
                      backgroundImage: `url(${getAvatarUrl(recommendedUser.avatar_url)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="user-details">
                    <div className="user-display-name">
                      {recommendedUser.display_name || recommendedUser.username}
                    </div>
                    <div className="user-username">@{recommendedUser.username}</div>
                    <div className="user-stats">
                      {recommendedUser.followers_count || 0} フォロワー
                    </div>
                  </div>
                </div>
                <div className="arrow-icon">›</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer currentPage="recommend" />
    </div>
  );
};
